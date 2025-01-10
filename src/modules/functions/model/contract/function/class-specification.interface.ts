export interface FunctionType {
    type: string;
    code_file_id: string;
}

export interface FunctionClassSpecification {
    id?: string;
    function_types: FunctionType[];
    version: string;
    outputs: string[];
}