export interface function_types {
    type: string;
    code_file_id: string;
}

export interface FunctionClassSpecification {
    id?: string;
    function_types: function_types[];
    version: string;
    outputs: string[];
}