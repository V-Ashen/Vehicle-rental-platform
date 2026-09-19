import { toast as sonnerToast } from "sonner";

export function useToast() {
  const customToast = (props: any) => {
    if (props.variant === 'destructive') {
      sonnerToast.error(props.title, { description: props.description });
    } else {
      sonnerToast.success(props.title, { description: props.description });
    }
  };

  return {
    toast: customToast,
    dismiss: sonnerToast.dismiss,
    toasts: [],
  };
}

export const toast = (props: any) => {
  if (props.variant === 'destructive') {
    sonnerToast.error(props.title, { description: props.description });
  } else {
    sonnerToast.success(props.title, { description: props.description });
  }
};
