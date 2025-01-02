import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

function App() {
  const { settings } = useStore();

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
