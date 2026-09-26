import { toast as sonnerToast } from "sonner";

export function useToast() {
  const customToast = (props: any) => {
    const options: any = { description: props.description };
    if (props.action) options.action = props.action;

    if (props.variant === 'destructive') {
      sonnerToast.error(props.title, options);
    } else if (props.variant === 'success') {
      sonnerToast.success(props.title, options);
    } else {
      sonnerToast(props.title, options);
    }
  };

  return {
    toast: customToast,
    dismiss: sonnerToast.dismiss,
    toasts: [],
  };
}

export const toast = (props: any) => {
  const options: any = { description: props.description };
  if (props.action) options.action = props.action;

  if (props.variant === 'destructive') {
    sonnerToast.error(props.title, options);
  } else if (props.variant === 'success') {
    sonnerToast.success(props.title, options);
  } else {
    sonnerToast(props.title, options);
  }
};
