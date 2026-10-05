import React from 'react';
import SofiaCoreManager from '@/components/SofiaCoreManager';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SofiaCorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <div className="border-b border-[#1a1a1c] px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/chat')}
            className="h-8 w-8 text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1c]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-white font-medium">Sofia Core Admin</span>
        </div>
      </div>
      <div className="h-[calc(100vh-57px)]">
        <SofiaCoreManager />
      </div>
    </div>
  );
};

export default SofiaCorePage;
