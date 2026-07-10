// src/components/WhatsappMockup.jsx
export const WhatsappMockup = () => {
  return (
    <div className="w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl p-2 relative">
      <div className="bg-[#efeae2] h-full rounded-[2.5rem] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#004739] p-4 text-white font-semibold">ChatBot ICPNA</div>
        {/* Chat area */}
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-[#d9fdd3] p-3 rounded-lg self-end ml-auto max-w-[80%]">
            Pásame el audio 4.6
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-3 rounded-lg self-start mr-auto max-w-[80%]"
          >
            🎧 Audio enviado. 📝 Transcripción disponible.
          </motion.div>
        </div>
      </div>
    </div>
  );
};