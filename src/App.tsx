import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Counter from "./Counter";
import {useState} from "react";

function App() {
  const [counts, setCounts] = useState([0, 0, 0, 100])   // TypeScript infers number[]
  const total = counts.reduce((a, b) => a + b, 0)

  function increment(index: number, step: number) {
    setCounts(prev => prev.map((c, i) => (i === index ? c + step : c)))
  }

  function reset(index: number, start: number) {
    // use setCounts to make a new array where position `index` is set back to `start`
    setCounts(prev => prev.map((c, i) => (i === index ? start : c)))
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>something of your own</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
          <p>
            {total}
          </p>
        </div>
        <div>
          <Counter label="Test Counter 1"
                   count={counts[0]}
                   onIncrement={ () => increment(0, 1)}
                   onReset={ () => reset(0, 0)}/>
          <Counter label="Test Counter 3"
                   count={counts[1]}
                   onIncrement={ () => increment(1, 3)}
                   onReset={ () => reset(1, 0)}/>
          <Counter label="Test Counter 5"
                   count={counts[2]}
                   onIncrement={ () => increment(2, 5)}
                   onReset={ () => reset(2, 0)}/>
          <Counter label="Test Counter 10"
                   count={counts[3]}
                   onIncrement={ () => increment(3, 10)}
                   onReset={ () => reset(3, 100)}/>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
