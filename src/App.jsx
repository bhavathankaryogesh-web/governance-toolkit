function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-3">
            Customise Smarter
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            A Governance Toolkit for SAP S/4HANA Decisions
          </p>
          <p className="text-slate-500 text-sm">
            Master Thesis · Yogesh Bhavathankar · CBS International Business School · 2026
          </p>
        </div>

        {/* Two pillars */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-blue-400 text-sm font-semibold mb-2">PILLAR 1</div>
            <h2 className="text-white font-bold text-lg mb-2">Scoring Matrix</h2>
            <p className="text-slate-400 text-sm">
              Score any customisation request across four dimensions and get a green / amber / red verdict.
            </p>
            <div className="mt-4 text-slate-500 text-xs font-mono">→ Coming soon</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-purple-400 text-sm font-semibold mb-2">PILLAR 2</div>
            <h2 className="text-white font-bold text-lg mb-2">Decision Tree</h2>
            <p className="text-slate-400 text-sm">
              Six guided questions to route your requirement to the right outcome.
            </p>
            <div className="mt-4 text-slate-500 text-xs font-mono">→ Coming soon</div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <p className="text-green-400 font-mono text-sm">Environment ready · Building in progress</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App