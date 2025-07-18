import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppRoutes from "./routes/AppRoutes";
import "./styles/globals.css";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
