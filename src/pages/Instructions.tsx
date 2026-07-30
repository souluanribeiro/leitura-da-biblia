import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Instructions() {
  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
      <div className="text-center py-4 space-y-3">
        <GraduationCap size={40} className="text-accent mx-auto" />
        <h1 className="text-xl font-bold text-text-primary">Como usar o Programa de Leitura da Bíblia</h1>
      </div>

      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          Você pode ler os livros da Bíblia pela ordem ou por assunto, com base nas categorias
          na aba <Link to="/secoes" className="text-accent font-bold underline">Seções</Link>. Se ler um grupo de
          capítulos por dia, você lerá a Bíblia inteira em um ano.
        </p>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">🔸</span>
            <p>Leia os dias com o marcador <span className="font-semibold text-orange-400">Laranja</span> para ter uma visão histórica geral dos tratos de Deus com os israelitas.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">🔹</span>
            <p>Leia os dias com o marcador <span className="font-semibold text-blue-400">Azul</span> para ter uma visão cronológica geral do desenvolvimento da congregação cristã.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <a
          href="https://www.jw.org/pt/biblioteca/videos/#pt/mediaitems/SeriesBibleTeachings/pub-ebtv_13_VIDEO"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#00A2FF' }}
        >
          Como Ler a Bíblia
        </a>
        <a
          href="https://www.jw.org/pt/ensinos-biblicos/jovens/animacoes-no-quadro-branco/biblia-pode-ajudar-voce/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#FA15A6' }}
        >
          A Bíblia pode ajudar você?
        </a>
        <a
          href="https://www.jw.org/pt/biblioteca/revistas/sentinela-estudo-outubro-2025/O-que-fazer-para-conseguir-ler-a-B%C3%ADblia-todos-os-dias/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#8F71FF' }}
        >
          O que fazer para conseguir ler a Bíblia todos os dias?
        </a>
        <a
          href="https://www.jw.org/pt/ensinos-biblicos/jovens/que-outros-jovens-dizem/ler-biblia/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#FF6F61' }}
        >
          Por que alguns jovens gostam de ler a Bíblia
        </a>
        <a
          href="https://www.jw.org/pt/ensinos-biblicos/jovens/perguntam/como-biblia-pode-ajudar-parte-1-conheca/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#FF5C00' }}
        >
          Conheça melhor sua Bíblia
        </a>
        <a
          href="https://www.jw.org/pt/ensinos-biblicos/jovens/perguntam/como-biblia-pode-me-ajudar-parte-2-interessante/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#FFAC1B' }}
        >
          Deixe a leitura da Bíblia mais interessante
        </a>
        <a
          href="https://www.jw.org/pt/ensinos-biblicos/jovens/perguntam/como-biblia-pode-me-ajudar-parte-3-aproveitar/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white font-semibold py-3 px-4 rounded-xl text-sm text-center transition-colors"
          style={{ backgroundColor: '#008F39' }}
        >
          Aproveite o máximo a sua leitura da Bíblia
        </a>
      </div>
    </div>
  )
}
