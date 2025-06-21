// AI-Powered Chama Manager
// Main entry point for the application

import Debug "mo:base/Debug";

actor Main {
  public func greet(name : Text) : async Text {
    Debug.print("Hello from AI-Powered Chama Manager!");
    "Hello, " # name # "! Welcome to the AI-Powered Chama Manager."
  };

  public query func healthCheck() : async Text {
    "AI-Powered Chama Manager is running successfully!"
  };
}