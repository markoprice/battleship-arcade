import { useState } from 'react';
import AbandonGameModal from './AbandonGameModal';

interface Props {
  onExit: () => void;
}

export default function ExitButton({ onExit }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-3 right-3 w-10 h-10 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
        style={{
          zIndex: 90,
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '14px',
          color: '#9B8FB8',
          background: 'rgba(20, 15, 30, 0.6)',
          border: '2px solid rgba(155, 143, 184, 0.3)',
          borderRadius: '4px',
        }}
        title="Return to Start"
      >
        X
      </button>
      <AbandonGameModal
        open={showModal}
        onConfirm={() => {
          setShowModal(false);
          onExit();
        }}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
