// Simple toast implementation

// Create a simple toast context
const ToastContext = {
  toast: ({ title, description, variant = "default" }) => {
    // Simple implementation using native browser notification or console
    if (title) {
      console.log(`Toast: ${title}${description ? ` - ${description}` : ""}`);
    }

    // You can extend this with a proper toast library later
    if (typeof window !== "undefined" && window.alert) {
      if (variant === "destructive") {
        console.error(
          `Error: ${title}${description ? ` - ${description}` : ""}`
        );
      } else {
        console.info(`Info: ${title}${description ? ` - ${description}` : ""}`);
      }
    }
  },
};

export const useToast = () => {
  return {
    toast: ToastContext.toast,
  };
};

export const toast = ToastContext.toast;
