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

        const existingIds = new Set(defaultLocalModels.map(m => m.id));
        const newModels = allModels.filter(m => !existingIds.has(m.id));

        const updatedModels = [
          ...settings.customModels.filter(m => 
            !endpoints.some(e => m.endpoint === e.url)
          ),
          ...defaultLocalModels,
          ...newModels
        ];

        updateCustomModels(updatedModels);
      } catch (error) {
        // console.error('Error fetching models:', error);
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
