import { Test, TestingModule } from '@nestjs/testing';
import { AdminWorkflowsController } from './admin-workflows.controller';
import { WorkflowsService} from "@modules/workflows/services/workflows.service";
import {Workflow} from "@modules/workflows/schemas/workflow.schema";
import {NotFoundException} from "@nestjs/common";
import {ObjectId} from "mongodb";

describe('AdminWorkflowsController', () => {
	let controller: AdminWorkflowsController;

	const sampleWorkflows: Workflow[] = [
		{
			name: 'workflow1',
			owner: 'admin',
			functions: [{
				name: 'funct1',
				class_specification_id: '0001',
				class_specification_version: '0.1',
				output_mapping: {},
				annotations: {},
			}],
			resources: [{
				name: 'res1',
				class_type: 'type1',
				output_mapping:{ "new_request": "external_trigger" },
				configurations: { "host": "demo.edgeless-project.eu", "methods": "POST" },
			}],
			annotations: {
				qos: { "priority_class": 1, "maximum_latency": 30, "execution_rate": 2 },
				characteristics: { "average_invocation_rate": 4, "peak_invocation_rate": 15 },
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	const mockWorkflowsService = {
		findWorkflows: jest.fn((offset, limit)=>({
			items: sampleWorkflows.slice(offset, offset + limit).map(w =>({
				name: w.name,
				createdAt: w.createdAt,
				updatedAt: w.updatedAt
			})),
			total: sampleWorkflows.length,
			limit: limit,
			offset: offset,
		})),
		getWorkflow: jest.fn((name, excl, owner)=>{
			const res = sampleWorkflows.find(workflow => workflow.name === name && workflow.owner === owner);
			if (res) return {
				name: res.name,
				functions: res.functions,
				resources: res.resources,
				annotations: res.annotations,
				createdAt: res.createdAt,
				updatedAt: res.updatedAt
			};
			else throw new NotFoundException()
		}),
		deleteWorkflow: jest.fn((name, owner) => {
			const res = sampleWorkflows.find(workflow => workflow.name === name && workflow.owner === owner);
			if(res) {
				sampleWorkflows.splice(sampleWorkflows.indexOf(res), 1);
				return { deletedCount: 1 };
			}
			else return { deletedCount: 0 };
		}),
		createWorkflow: jest.fn(dto => ({
			name: dto.name,
			functions: dto.functions.map(f => ({
				name: f.name,
				class_specification_id: f.class_specification_id,
				class_specification_version: f.class_specification_version,
				output_mapping: f.output_mapping,
				annotations: f.annotations,
			})),
			resources: dto.resources,
			annotations: dto.annotations,
			createdAt: new Date(),
			updatedAt: new Date()
		})),
		updateWorkflow: jest.fn((name,dto,owner) => {
			const wf = sampleWorkflows.find(w => w.name === name && w.owner === owner);
			if (wf){
				console.log(wf)
				wf.name = dto.name;
				wf.functions = dto.functions;
				wf.resources = dto.resources;
				wf.annotations = dto.annotations;
				wf.updatedAt = new Date();
				return {
					name: wf.name,
					functions: wf.functions,
					resources: wf.resources,
					annotations: wf.annotations,
					createdAt: wf.createdAt,
					updatedAt: wf.updatedAt
				};
			}else throw new Error("The workflow doesn't exist, please create the workflow first");
		}),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AdminWorkflowsController],
			providers: [
				{
					provide: WorkflowsService,
					useValue: mockWorkflowsService
				}
			]
		}).compile();
		controller = module.get<AdminWorkflowsController>(AdminWorkflowsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getWorkflows', () => {
		it('should return an array of workflows with 1 item', async () => {
			const limit = 10;
			const offset = 0;

			const result = await controller.findWorkflows(offset, limit);
			const expectedResult = {
				items: sampleWorkflows.map(workflow => ({
					name: workflow.name,
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				})),
				total: sampleWorkflows.length,
				limit,
				offset
			};
			expect(result).toEqual(expectedResult);
		})

		it('should return an array of workflows with 0 items', async () => {
			const limit = 10;
			const offset = 1;

			const result = await controller.findWorkflows(offset, limit);
			const expectedResult = {
				items: [],
				total: sampleWorkflows.length,
				limit,
				offset
			};
			expect(result).toEqual(expectedResult);
		})
	});
	describe('getWorkflow', () => {
		it('should return a workflow with the specified name', async () => {
			const workflowName = sampleWorkflows[0].name;
			const result = await controller.getWorkflow(workflowName);
			const expectedResult = {
				name: workflowName,
				functions: sampleWorkflows[0].functions,
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			};
			expect(result).toEqual(expectedResult);
		})
		it('should throw an error if the workflow is not found', async () => {
			const workflowName = 'non-existing-workflow';
			await expect(controller.getWorkflow(workflowName)).rejects.toThrow(NotFoundException);
		})
	});
	describe('createWorkflow', () => {
		it('should create a workflow as the sample worflow first element', async () => {
			const workflow = {
				name: sampleWorkflows[0].name,
				functions: sampleWorkflows[0].functions.map(f => ({
					...f,
					_id: f.name as unknown as ObjectId
				})),
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
			};

			const res = await controller.createWorkflow(workflow);
			const expectedResult = {
				name: workflow.name,
				functions: workflow.functions.map(f => ({
					name: f.name,
					class_specification_id: f.class_specification_id,
					class_specification_version: f.class_specification_version,
					output_mapping: f.output_mapping,
					annotations: f.annotations,
				})),
				resources: workflow.resources,
				annotations: workflow.annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			};
			expect(res).toEqual(expectedResult);
		});
	});
	describe('updateWorkflow', () => {
		it('should update a workflow with the specified name', async () => {
			const workflowName = sampleWorkflows[0].name;
			const workflow = {
				name: workflowName,
				functions: [{
					_id: new ObjectId(),
					name: 'funct2',
					class_specification_id: '0002',
					class_specification_version: '0.1',
					output_mapping: {},
					annotations: {
						qos: {'newAnnotation': 'Annotation'},
						characteristics: {'newCharacteristic': 'Characteristic'},
						env: {'newEnv': 'Env'},
					},
				}],
				resources: [{
					name: 'res2',
					class_type: 'type2',
					output_mapping:{ "new_request": "external_trigger" },
					configurations: { "host": "demo.edgeless-project.eu", "methods": "POST" },
				}],
				annotations: {
					qos: {'newAnnotation': 'Annotation'},
					characteristics: {'newCharacteristic': 'Characteristic'}
				},
			}
			const res = await controller.updateWorkflow(workflow, workflowName);
			const expectedResult = {
				name: workflowName,
				functions: workflow.functions,
				resources: workflow.resources,
				annotations: workflow.annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			};
			expect(res).toEqual(expectedResult);

		})
	});
	describe('deleteWorkflow', () => {
		it('should delete a workflow with the specified name', async () => {
			const workflowName = sampleWorkflows[0].name;
			const result = await controller.deleteWorkflow(workflowName);
			expect(result).toEqual({ deletedCount: 1 });
		})
		it('should not delete any document if the workflow is not found', async () => {
			const workflowName = 'non-existing-workflow';
			const result = await controller.deleteWorkflow(workflowName);
			expect(result).toEqual({ deletedCount: 0 });
		})
	});
})