/**
 * Modal provider
 * Context provider for modals and dialogs
 */

'use client';

import { ReactNode } from 'react';
import { AlertDialog, Modal } from '@/components/ui';
import { useModalStore } from '@/store';

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { modals, closeModal } = useModalStore();
  const modalList = Array.from(modals.values());

  return (
    <>
      {children}
      {modalList.map((modal) => {
        const close = () => closeModal(modal.id);

        if (modal.type === 'alert' || modal.type === 'confirm') {
          return (
            <AlertDialog
              key={modal.id}
              isOpen
              onClose={close}
              title={modal.title || 'Confirm action'}
              description={modal.message}
              confirmLabel={modal.confirmLabel || (modal.type === 'alert' ? 'OK' : 'Confirm')}
              cancelLabel={modal.cancelLabel}
              isDestructive={modal.isDestructive}
              onConfirm={() => {
                modal.onConfirm?.();
                close();
              }}
              onCancel={() => {
                modal.onCancel?.();
                close();
              }}
            />
          );
        }

        return (
          <Modal
            key={modal.id}
            isOpen
            onClose={close}
            title={modal.title}
            description={modal.message}
          >
            {modal.data?.content || null}
          </Modal>
        );
      })}
    </>
  );
}
