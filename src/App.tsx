import { fixtureProject } from './fixtures/project'
import './App.css'

function App() {
  const trackCount = fixtureProject.tracks.length
  const totalSteps = fixtureProject.bars * fixtureProject.beatsPerBar * fixtureProject.subdivision

  return (
    <div className="App">
      <header className="App-header">
        <h1>PlayBand AI</h1>
        <p>音乐游乐场</p>
      </header>

      <main className="App-main">
        <div className="fixture-info">
          <h2>🎵 演示项目已加载</h2>
          <div className="stats">
            <div className="stat">
              <span className="stat-label">音轨数量:</span>
              <span className="stat-value">{trackCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">小节:</span>
              <span className="stat-value">{fixtureProject.bars}</span>
            </div>
            <div className="stat">
              <span className="stat-label">总步数:</span>
              <span className="stat-value">{totalSteps}</span>
            </div>
            <div className="stat">
              <span className="stat-label">速度:</span>
              <span className="stat-value">{fixtureProject.tempo} BPM</span>
            </div>
            <div className="stat">
              <span className="stat-label">风格:</span>
              <span className="stat-value">{fixtureProject.style}</span>
            </div>
            <div className="stat">
              <span className="stat-label">情绪:</span>
              <span className="stat-value">{fixtureProject.mood}</span>
            </div>
          </div>

          <div className="tracks">
            <h3>音轨列表</h3>
            {fixtureProject.tracks.map(track => (
              <div key={track.id} className="track-item" style={{ borderLeftColor: track.color }}>
                <div className="track-name">{track.name}</div>
                <div className="track-details">
                  类型: {track.kind} |
                  片段: {track.clips.length} |
                  静音: {track.muted ? '是' : '否'}
                </div>
              </div>
            ))}
          </div>

          {fixtureProject.lastExplanation && (
            <div className="explanation">
              <h3>最近操作说明</h3>
              <p><strong>{fixtureProject.lastExplanation.summary}</strong></p>
              <ul>
                {fixtureProject.lastExplanation.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>✨ 基础脚手架已就绪 - Tone.js 已集成</p>
      </footer>
    </div>
  )
}

export default App
