import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-white">
      <div className="flex items-center gap-6">
        <img className="h-20 w-20" src={viteLogo} alt="Vite logo" />
        <img className="h-20 w-20" src={reactLogo} alt="React logo" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Vite + React + Tailwind</h1>
        <p className="max-w-xl text-sm text-slate-300">
          Project scaffold ready. Start editing <code>src/App.tsx</code> to build
          the UI.
        </p>
      </div>
    </main>
  )
}
