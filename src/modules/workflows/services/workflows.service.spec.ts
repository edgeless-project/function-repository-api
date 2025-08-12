import { Test, TestingModule } from '@nestjs/testing';
import {WorkflowsService} from "@modules/workflows/services/workflows.service";
import {Workflow, WorkflowDocument} from "@modules/workflows/schemas/workflow.schema";
import {FunctionDocument, Function} from "@modules/functions/schemas/function.schema";
import {Model} from "mongoose";
import {getModelToken} from "@nestjs/mongoose";
import {ObjectId} from "mongodb";

describe('WorkflowsService', () => {
	let service: WorkflowsService;
	let workflowModel: jest.Mocked<Model<WorkflowDocument>>;
	let functionModel: jest.Mocked<Model<FunctionDocument>>;
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

	const mockWorkflowModel = {
		exists: jest.fn((dto)=>{
			const exists = sampleWorkflows.find(workflow => workflow.name === dto.name && workflow.owner === dto.owner);
			if (exists) {
				return Promise.resolve({
					...exists,
					id: new ObjectId()
				});
			}else
				Promise.resolve(null);
		}),
		create: jest.fn((dto)=>{
			return{
				...dto,
				_id: new ObjectId()
			}
		}),
		find: jest.fn(()=>{
			return {
				limit: jest.fn((limit) => {
					return {
						skip: jest.fn((offset) => {
							return {
								exec: jest.fn(() => {
									const result = sampleWorkflows.slice(offset, offset + limit).map(w => ({
										_id: new ObjectId(),
										name: w.name,
										functions: w.functions,
										resources: w.resources,
										annotations: w.annotations,
										owner: w.owner,
										updatedAt: w.updatedAt,
										createdAt: w.createdAt
									}));
									return result;
								})
							};
						}),
					};
				}),
			};
		}),
		findOne: jest.fn((dto)=>({
			exec: jest.fn(()=>{
				const workflow = sampleWorkflows.find(workflow => workflow.name === dto.name && workflow.owner === dto.owner);
				return Promise.resolve(workflow)
			})
		})),
		findOneAndUpdate: jest.fn((dto, set, state)=>{
			const wf = sampleWorkflows.find(w => w.name === dto.name && w.owner == dto.owner);
			const data = set['$set'];
			if (wf) {
				wf.functions = data.functions || wf.functions;
				wf.resources = data.resources || wf.resources;
				wf.annotations = data.annotations || wf.annotations;
				wf.updatedAt = new Date();
				return {
					...wf,
					_id: new ObjectId()
				}
			}
		}),
		deleteOne: jest.fn((dto)=>{
			const wf = sampleWorkflows.find(w => w.name == dto.name && w.owner == dto.owner);
			if (wf) return Promise.resolve({deletedCount: 1});
			else return Promise.resolve({deletedCount: 0});
		}),
		countDocuments: jest.fn(()=>({
			exec: jest.fn(()=>{
				return sampleWorkflows.length
			})
		})),
	};

	const mockFunctionModel = {
		findOne: jest.fn((dto) => ({
			exec: jest.fn(()=>{
				const func = sampleWorkflows[0].functions.find(f => f.class_specification_id === dto.id && f.class_specification_version === dto.version);
				if (func) {
					return Promise.resolve({
						...func
					});
				} else {
					return Promise.resolve(null);
				}
			})
		})),
		find: jest.fn(({ id, version, owner }) => {
			const funcs = sampleWorkflows[0].functions.filter(f => f.class_specification_id === id && f.class_specification_version === version);
			return {
				lean: jest.fn(() => ({
					exec: jest.fn(() => {
						return Promise.resolve(funcs);
					})
				})),
			}
		}),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers:[
				WorkflowsService,
				{
					provide: getModelToken(Workflow.name),
					useValue: mockWorkflowModel
				},
				{
					provide: getModelToken(Function.name),
					useValue: mockFunctionModel
				}
			],
		}).compile();

		service = module.get<WorkflowsService>(WorkflowsService);
		workflowModel = module.get(getModelToken(Workflow.name));
		functionModel = module.get(getModelToken(Function.name));
	})
	it('should be defined', () => {
		expect(service).toBeDefined();
	})

	describe('CreateWorkflow', () => {
		it('should create a workflow', async () => {

			const mockWorkflowData = {
				name: sampleWorkflows[0].name+'-test',
				functions: sampleWorkflows[0].functions.map(f => ({...f,_id: f.name as unknown as ObjectId})),
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
			}

			const result = await service.createWorkflow(mockWorkflowData, 'admin');

			expect(workflowModel.create).toHaveBeenCalledWith(expect.objectContaining({
				name: mockWorkflowData.name,
				functions: expect.any(Array),
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
				owner: 'admin'
			}));
			expect(result).toEqual(
				{
					...mockWorkflowData,
					functions: sampleWorkflows[0].functions
				}
			);
		});
	});

	describe('UpdateWorkflow', () => {
		it('should update a workflow', async () => {

			const mockWorkflowData = {
				functions: sampleWorkflows[0].functions.map(f => ({...f,_id: f.name as unknown as ObjectId})),
				resources: [{
					name: 'res2',
					class_type: 'type2',
					output_mapping:{ "new_request": "external_trigger" },
					configurations: { "host": "demo.edgeless-project.eu", "methods": "POST" },
				}],
				annotations: {
					qos: { "priority_class": 2, "maximum_latency": 60, "execution_rate": 2 },
					characteristics: { "average_invocation_rate": 2, "peak_invocation_rate": 15 },
				}
			}

			const result = await service.updateWorkflow(sampleWorkflows[0].name, mockWorkflowData, 'admin');

			const expectedResult = {
				name: sampleWorkflows[0].name,
				functions: mockWorkflowData.functions.map(f => ({
					name: f.name,
					class_specification_id: f.class_specification_id,
					class_specification_version: f.class_specification_version,
					output_mapping: f.output_mapping,
					annotations: f.annotations,
				})),
				resources: mockWorkflowData.resources,
				annotations: mockWorkflowData.annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			}

			expect(workflowModel.findOne).toHaveBeenCalledWith({
				name: sampleWorkflows[0].name,
				owner: 'admin'
			});

			mockWorkflowData.functions.forEach((f) => {
				expect(functionModel.findOne).toHaveBeenCalledWith({
					id: f.class_specification_id,
					version: f.class_specification_version,
					owner: 'admin'
				});
			});

			expect(result).toEqual(expectedResult);
		});
	});

	describe('DeleteWorkflow', () => {
		it('should delete a workflow', async () => {
			const workflowName = sampleWorkflows[0].name;
			const result = await service.deleteWorkflow(workflowName, 'admin');

			expect(workflowModel.deleteOne).toHaveBeenCalledWith({name: workflowName, owner: 'admin'});
			expect(result).toEqual({ deletedCount: 1 });
		});
	});

	describe('GetWorkflow', () => {
		it('should get a workflow from its name excluding class specification data', async () => {
			const workflowName = sampleWorkflows[0].name;
			const result = await service.getWorkflow(workflowName, true, 'admin');
			const expectedResult = {
				name: workflowName,
				functions: sampleWorkflows[0].functions,
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			};
			expect(result).toEqual(expectedResult);
		});
		it('should get a workflow with the specific class specification data', async () => {
			const workflowName = sampleWorkflows[0].name;
			const result = await service.getWorkflow(workflowName, false, 'admin');
			const expectedResult = {
				name: workflowName,
				resources: sampleWorkflows[0].resources,
				annotations: sampleWorkflows[0].annotations,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
				functions: sampleWorkflows[0].functions.map(f => ({
					name: f.name,
					class_specification: {
						function_types:[{}],
						id:f.class_specification_id
					},
					output_mapping: f.output_mapping,
					annotations: f.annotations,
				}))
			}

			expect(result).toEqual(expectedResult);
		});
	})
	describe('FindWorkflows', () => {
		it('should return an array of workflows with 1 item', async () => {
			const limit = 10;
			const offset = 0;
			const result = await service.findWorkflows(offset, limit);
			const expectedResult = {
				items: sampleWorkflows.map(workflow => ({
					name: workflow.name,
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				})),
				total: sampleWorkflows.length,
				limit,
				offset
			}
			expect(result).toEqual(expectedResult);
		})
	})
})