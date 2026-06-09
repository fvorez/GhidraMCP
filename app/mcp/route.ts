import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

// Default Ghidra server URL - users can configure this via environment variable
const DEFAULT_GHIDRA_SERVER = process.env.GHIDRA_SERVER_URL || "http://127.0.0.1:8080/";

// Helper function to safely make GET requests to Ghidra server
async function safeGet(endpoint: string, params: Record<string, string | number> = {}): Promise<string[]> {
  const url = new URL(endpoint, DEFAULT_GHIDRA_SERVER);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const text = await response.text();
      return text.split("\n").filter((line) => line.trim());
    } else {
      return [`Error ${response.status}: ${await response.text()}`];
    }
  } catch (error) {
    return [`Request failed: ${error instanceof Error ? error.message : String(error)}`];
  }
}

// Helper function to safely make POST requests to Ghidra server
async function safePost(endpoint: string, data: Record<string, string> | string): Promise<string> {
  const url = new URL(endpoint, DEFAULT_GHIDRA_SERVER);

  try {
    let body: string;
    let contentType: string;

    if (typeof data === "string") {
      body = data;
      contentType = "text/plain";
    } else {
      body = new URLSearchParams(data).toString();
      contentType = "application/x-www-form-urlencoded";
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });

    if (response.ok) {
      return (await response.text()).trim();
    } else {
      return `Error ${response.status}: ${await response.text()}`;
    }
  } catch (error) {
    return `Request failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const handler = createMcpHandler(
  async (server) => {
    // Tool 1: list_methods
    server.registerTool(
      "list_methods",
      {
        title: "list_methods",
        description: "List all function names in the program with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("methods", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 2: list_classes
    server.registerTool(
      "list_classes",
      {
        title: "list_classes",
        description: "List all namespace/class names in the program with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("classes", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 3: decompile_function
    server.registerTool(
      "decompile_function",
      {
        title: "decompile_function",
        description: "Decompile a specific function by name and return the decompiled C code.",
        inputSchema: z.object({
          name: z.string().describe("Function name to decompile"),
        }),
      },
      async ({ name }) => {
        const result = await safePost("decompile", name);
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 4: rename_function
    server.registerTool(
      "rename_function",
      {
        title: "rename_function",
        description: "Rename a function by its current name to a new user-defined name.",
        inputSchema: z.object({
          old_name: z.string().describe("Current function name"),
          new_name: z.string().describe("New function name"),
        }),
      },
      async ({ old_name, new_name }) => {
        const result = await safePost("renameFunction", { oldName: old_name, newName: new_name });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 5: rename_data
    server.registerTool(
      "rename_data",
      {
        title: "rename_data",
        description: "Rename a data label at the specified address.",
        inputSchema: z.object({
          address: z.string().describe("Address of the data label"),
          new_name: z.string().describe("New name for the data label"),
        }),
      },
      async ({ address, new_name }) => {
        const result = await safePost("renameData", { address, newName: new_name });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 6: list_segments
    server.registerTool(
      "list_segments",
      {
        title: "list_segments",
        description: "List all memory segments in the program with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("segments", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 7: list_imports
    server.registerTool(
      "list_imports",
      {
        title: "list_imports",
        description: "List imported symbols in the program with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("imports", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 8: list_exports
    server.registerTool(
      "list_exports",
      {
        title: "list_exports",
        description: "List exported functions/symbols with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("exports", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 9: list_namespaces
    server.registerTool(
      "list_namespaces",
      {
        title: "list_namespaces",
        description: "List all non-global namespaces in the program with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("namespaces", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 10: list_data_items
    server.registerTool(
      "list_data_items",
      {
        title: "list_data_items",
        description: "List defined data labels and their values with pagination.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ offset, limit }) => {
        const result = await safeGet("data", { offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 11: search_functions_by_name
    server.registerTool(
      "search_functions_by_name",
      {
        title: "search_functions_by_name",
        description: "Search for functions whose name contains the given substring.",
        inputSchema: z.object({
          query: z.string().describe("Search query substring"),
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of results"),
        }),
      },
      async ({ query, offset, limit }) => {
        if (!query) {
          return { content: [{ type: "text", text: "Error: query string is required" }] };
        }
        const result = await safeGet("searchFunctions", { query, offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 12: rename_variable
    server.registerTool(
      "rename_variable",
      {
        title: "rename_variable",
        description: "Rename a local variable within a function.",
        inputSchema: z.object({
          function_name: z.string().describe("Name of the function containing the variable"),
          old_name: z.string().describe("Current variable name"),
          new_name: z.string().describe("New variable name"),
        }),
      },
      async ({ function_name, old_name, new_name }) => {
        const result = await safePost("renameVariable", {
          functionName: function_name,
          oldName: old_name,
          newName: new_name,
        });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 13: get_function_by_address
    server.registerTool(
      "get_function_by_address",
      {
        title: "get_function_by_address",
        description: "Get a function by its address.",
        inputSchema: z.object({
          address: z.string().describe("Address of the function (e.g., '0x1400010a0')"),
        }),
      },
      async ({ address }) => {
        const result = await safeGet("get_function_by_address", { address });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 14: get_current_address
    server.registerTool(
      "get_current_address",
      {
        title: "get_current_address",
        description: "Get the address currently selected by the user in Ghidra.",
        inputSchema: z.object({}),
      },
      async () => {
        const result = await safeGet("get_current_address");
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 15: get_current_function
    server.registerTool(
      "get_current_function",
      {
        title: "get_current_function",
        description: "Get the function currently selected by the user in Ghidra.",
        inputSchema: z.object({}),
      },
      async () => {
        const result = await safeGet("get_current_function");
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 16: list_functions
    server.registerTool(
      "list_functions",
      {
        title: "list_functions",
        description: "List all functions in the database.",
        inputSchema: z.object({}),
      },
      async () => {
        const result = await safeGet("list_functions");
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 17: decompile_function_by_address
    server.registerTool(
      "decompile_function_by_address",
      {
        title: "decompile_function_by_address",
        description: "Decompile a function at the given address.",
        inputSchema: z.object({
          address: z.string().describe("Address of the function to decompile"),
        }),
      },
      async ({ address }) => {
        const result = await safeGet("decompile_function", { address });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 18: disassemble_function
    server.registerTool(
      "disassemble_function",
      {
        title: "disassemble_function",
        description: "Get assembly code (address: instruction; comment) for a function.",
        inputSchema: z.object({
          address: z.string().describe("Address of the function to disassemble"),
        }),
      },
      async ({ address }) => {
        const result = await safeGet("disassemble_function", { address });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 19: set_decompiler_comment
    server.registerTool(
      "set_decompiler_comment",
      {
        title: "set_decompiler_comment",
        description: "Set a comment for a given address in the function pseudocode.",
        inputSchema: z.object({
          address: z.string().describe("Address to add comment at"),
          comment: z.string().describe("Comment text"),
        }),
      },
      async ({ address, comment }) => {
        const result = await safePost("set_decompiler_comment", { address, comment });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 20: set_disassembly_comment
    server.registerTool(
      "set_disassembly_comment",
      {
        title: "set_disassembly_comment",
        description: "Set a comment for a given address in the function disassembly.",
        inputSchema: z.object({
          address: z.string().describe("Address to add comment at"),
          comment: z.string().describe("Comment text"),
        }),
      },
      async ({ address, comment }) => {
        const result = await safePost("set_disassembly_comment", { address, comment });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 21: rename_function_by_address
    server.registerTool(
      "rename_function_by_address",
      {
        title: "rename_function_by_address",
        description: "Rename a function by its address.",
        inputSchema: z.object({
          function_address: z.string().describe("Address of the function"),
          new_name: z.string().describe("New name for the function"),
        }),
      },
      async ({ function_address, new_name }) => {
        const result = await safePost("rename_function_by_address", {
          function_address,
          new_name,
        });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 22: set_function_prototype
    server.registerTool(
      "set_function_prototype",
      {
        title: "set_function_prototype",
        description: "Set a function's prototype.",
        inputSchema: z.object({
          function_address: z.string().describe("Address of the function"),
          prototype: z.string().describe("New function prototype (e.g., 'int main(int argc, char **argv)')"),
        }),
      },
      async ({ function_address, prototype }) => {
        const result = await safePost("set_function_prototype", {
          function_address,
          prototype,
        });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 23: set_local_variable_type
    server.registerTool(
      "set_local_variable_type",
      {
        title: "set_local_variable_type",
        description: "Set a local variable's type.",
        inputSchema: z.object({
          function_address: z.string().describe("Address of the function"),
          variable_name: z.string().describe("Name of the variable"),
          new_type: z.string().describe("New type for the variable"),
        }),
      },
      async ({ function_address, variable_name, new_type }) => {
        const result = await safePost("set_local_variable_type", {
          function_address,
          variable_name,
          new_type,
        });
        return { content: [{ type: "text", text: result }] };
      }
    );

    // Tool 24: get_xrefs_to
    server.registerTool(
      "get_xrefs_to",
      {
        title: "get_xrefs_to",
        description: "Get all references to the specified address (xref to).",
        inputSchema: z.object({
          address: z.string().describe("Target address in hex format (e.g., '0x1400010a0')"),
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of references to return"),
        }),
      },
      async ({ address, offset, limit }) => {
        const result = await safeGet("xrefs_to", { address, offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 25: get_xrefs_from
    server.registerTool(
      "get_xrefs_from",
      {
        title: "get_xrefs_from",
        description: "Get all references from the specified address (xref from).",
        inputSchema: z.object({
          address: z.string().describe("Source address in hex format (e.g., '0x1400010a0')"),
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of references to return"),
        }),
      },
      async ({ address, offset, limit }) => {
        const result = await safeGet("xrefs_from", { address, offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 26: get_function_xrefs
    server.registerTool(
      "get_function_xrefs",
      {
        title: "get_function_xrefs",
        description: "Get all references to the specified function by name.",
        inputSchema: z.object({
          name: z.string().describe("Function name to search for"),
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(100).describe("Maximum number of references to return"),
        }),
      },
      async ({ name, offset, limit }) => {
        const result = await safeGet("function_xrefs", { name, offset, limit });
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );

    // Tool 27: list_strings
    server.registerTool(
      "list_strings",
      {
        title: "list_strings",
        description: "List all defined strings in the program with their addresses.",
        inputSchema: z.object({
          offset: z.number().int().default(0).describe("Pagination offset"),
          limit: z.number().int().default(2000).describe("Maximum number of strings to return"),
          filter: z.string().optional().describe("Optional filter to match within string content"),
        }),
      },
      async ({ offset, limit, filter }) => {
        const params: Record<string, string | number> = { offset, limit };
        if (filter) {
          params.filter = filter;
        }
        const result = await safeGet("strings", params);
        return { content: [{ type: "text", text: result.join("\n") }] };
      }
    );
  },
  {
    capabilities: {
      tools: {
        list_methods: { description: "List all function names in the program with pagination" },
        list_classes: { description: "List all namespace/class names in the program with pagination" },
        decompile_function: { description: "Decompile a specific function by name and return the decompiled C code" },
        rename_function: { description: "Rename a function by its current name to a new user-defined name" },
        rename_data: { description: "Rename a data label at the specified address" },
        list_segments: { description: "List all memory segments in the program with pagination" },
        list_imports: { description: "List imported symbols in the program with pagination" },
        list_exports: { description: "List exported functions/symbols with pagination" },
        list_namespaces: { description: "List all non-global namespaces in the program with pagination" },
        list_data_items: { description: "List defined data labels and their values with pagination" },
        search_functions_by_name: { description: "Search for functions whose name contains the given substring" },
        rename_variable: { description: "Rename a local variable within a function" },
        get_function_by_address: { description: "Get a function by its address" },
        get_current_address: { description: "Get the address currently selected by the user in Ghidra" },
        get_current_function: { description: "Get the function currently selected by the user in Ghidra" },
        list_functions: { description: "List all functions in the database" },
        decompile_function_by_address: { description: "Decompile a function at the given address" },
        disassemble_function: { description: "Get assembly code (address: instruction; comment) for a function" },
        set_decompiler_comment: { description: "Set a comment for a given address in the function pseudocode" },
        set_disassembly_comment: { description: "Set a comment for a given address in the function disassembly" },
        rename_function_by_address: { description: "Rename a function by its address" },
        set_function_prototype: { description: "Set a function's prototype" },
        set_local_variable_type: { description: "Set a local variable's type" },
        get_xrefs_to: { description: "Get all references to the specified address (xref to)" },
        get_xrefs_from: { description: "Get all references from the specified address (xref from)" },
        get_function_xrefs: { description: "Get all references to the specified function by name" },
        list_strings: { description: "List all defined strings in the program with their addresses" },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
