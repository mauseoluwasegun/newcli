/**
 * === VAUL ("vaul") — Mobile Drawer ===
 * A drawer component that slides up from the bottom of the screen.
 * Perfect for mobile-responsive modals. Built on top of Radix UI Dialog.
 * Used here as the mobile version of modals (instead of a centered dialog).
 * World use cases: Mobile apps, responsive web apps needing bottom sheets.
 */
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * === RADIX UI DIALOG ("@radix-ui/react-dialog") ===
 * Accessible, unstyled dialog/modal component.
 * Used here as the desktop version of modals (centered overlay).
 * World use cases: Any web app needing accessible modals — used by Vercel, Linear, Supabase.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** === Local hook that detects if the screen is mobile-sized === */
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  children: React.ReactNode;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
}

const ResponsiveModal = ({ children, open, title, onOpenChange }: Props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveModal;
