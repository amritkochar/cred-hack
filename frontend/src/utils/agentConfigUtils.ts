/**
 * Utilities for agent configuration
 */

import { AgentConfig } from "@/types";
import { getUserPersona } from "./storage";

/**
 * Update agent config with user persona data
 * 
 * This function takes an agent config and injects the user persona data
 * from local storage into the instructions field.
 */
export const injectUserPersonaToAgentConfig = (agentConfig: AgentConfig): AgentConfig => {
  const userPersona = getUserPersona();
  console.log("here");
  console.log(userPersona);
  if (!userPersona) {
    // If no user persona data is available, return the original config
    return agentConfig;
  }
  
  // Create a deep copy of the agent config to avoid mutating the original
  const updatedConfig = JSON.parse(JSON.stringify(agentConfig)) as AgentConfig;
  
  // Find the placeholder in the instructions and replace it with the actual user persona data
  const userPersonaPlaceholder = /<add-user-persona>/;
  
  if (updatedConfig.instructions && userPersonaPlaceholder.test(updatedConfig.instructions)) {
    console.log("Original instructions:", updatedConfig.instructions.substring(0, 100) + "...");
    console.log("Placeholder found:", userPersonaPlaceholder.test(updatedConfig.instructions));
    
    updatedConfig.instructions = updatedConfig.instructions.replace(
      userPersonaPlaceholder,
      JSON.stringify(userPersona)
    );
    
    console.log("Instructions after replacement (excerpt):", 
      updatedConfig.instructions.substring(0, 100) + "...");
  } else {
    console.log("Placeholder not found in instructions");
  }
  // Print the updated configuration for debugging purposes
  console.log("Updated Agent Config:", JSON.stringify(updatedConfig, null, 2));
  return updatedConfig;
};

/**
 * Get agent config with user persona data injected
 */
export const getAgentConfigWithUserPersona = (agentConfig: AgentConfig): AgentConfig => {
  return injectUserPersonaToAgentConfig(agentConfig);
};
