import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { defaultLocalModels, modelService } from "./lib/localmodels";
import { PRESET_ENDPOINTS } from "./lib/constants";
import { CustomModel, GlobalSettings } from "./lib/types";

function App() {
  const { settings, updateCustomModels } = useStore();

  useEffect(() => {
    const fetchModels = async () => {
      console.log('fetching models');
      const endpoints = PRESET_ENDPOINTS.map(e => ({
        url: e.url,
        provider: 'openai'
      }));
    
      // First, ensure we have the existing custom models
      const existingCustomModels = settings.customModels || [];
    
      const modelPromises = endpoints.map(e => 
        modelService.getAvailableModels(e.url)
      );
    
      try {
        const modelLists = await Promise.allSettled(modelPromises);
        const allModels = modelLists
          .filter((result): result is PromiseFulfilledResult<CustomModel[]> => 
            result.status === 'fulfilled'
          )
          .flatMap(result => result.value);
    
        // Preserve ALL existing custom models that aren't from these endpoints
        const userCustomModels = existingCustomModels.filter(m => 
          !endpoints.some(e => m.endpoint === e.url)
        );
    
        // Then merge with new local models
        const updatedModels = [
          ...userCustomModels,  // Keep ALL existing custom models
          ...defaultLocalModels,  // Add default models
          ...allModels         // Add new local models
        ];
    
        updateCustomModels(updatedModels);
      } catch (error) {
        // If there's an error, preserve existing models
        updateCustomModels(existingCustomModels);
        console.warn('Error fetching models:', error);
      }
    };
  
    fetchModels();
    const interval = setInterval(fetchModels, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [updateCustomModels]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
  }, [settings.primaryColor]);
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
    </Switch>
  );
}

export default App;
