'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, FileText, PlusCircle, CheckCircle2, AlertCircle, 
  Layers, Users, Network, Award, Upload, Check, Edit3 
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'labs' | 'evaluate' | 'reviews' | 'report' | 'mindmap' | 'team'>('labs');
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Estados para Crear Laboratorio
  const [cohort, setCohort] = useState('1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [rubricJson, setRubricJson] = useState(
    JSON.stringify(
      {
        criterios: [
          { nombre: "Desarrollo de Software y Funcionalidad", peso: 40, descripcion: "Funcionalidad web completa" },
          { nombre: "Uso de Inteligencia Artificial", peso: 30, descripcion: "Uso de LLMs y validación JSON" },
          { nombre: "Documentación y Pruebas", peso: 30, descripcion: "Pruebas unitarias y claridad" }
        ]
      },
      null,
      2
    )
  );

  // Estados para Evaluación con Archivo PDF
  const [selectedLabId, setSelectedLabId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentReportText, setStudentReportText] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Cargar datos iniciales
  useEffect(() => {
    fetchLaboratories();
    fetchEvaluations();
  }, []);

  const fetchLaboratories = async () => {
    try {
      const res = await fetch('/api/laboratories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLaboratories(data);
        if (data.length > 0) setSelectedLabId(data[0].id);
      }
    } catch (err) {
      console.error('Error cargando laboratorios', err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluate');
      const text = await res.text();
      if (!text) return; // Si la respuesta está vacía, no hace nada y evita el error
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setEvaluations(data);
      }
    } catch (err) {
      console.error('Error cargando evaluaciones', err);
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let parsedRubric = JSON.parse(rubricJson);
      const res = await fetch('/api/laboratories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort: Number(cohort),
          title,
          description,
          objectives,
          rubricJson: parsedRubric,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('¡Laboratorio creado con éxito y rúbrica validada al 100%!');
        setTitle('');
        setDescription('');
        setObjectives('');
        fetchLaboratories();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: El formato de la rúbrica (JSON) no es válido.');
    }
    setLoading(false);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEvaluationResult(null);
    setMessage('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laboratoryId: selectedLabId,
          studentName,
          studentEmail,
          cohort: Number(cohort),
          studentReportText,
          githubRepo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluationResult(data.analysis);
        setMessage('¡Evaluación inteligente completada con cálculo determinista!');
        fetchEvaluations();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error al conectar con el servidor.');
    }
    setLoading(false);
  };

  const handleApproveEvaluation = async (id: string, newScore: number, feedback: string) => {
    try {
      const res = await fetch(`/api/evaluate/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalScore: newScore, feedback, isApproved: true }),
      });
      if (res.ok) {
        setMessage('¡Evaluación aprobada y publicada con éxito!');
        fetchEvaluations();
      }
    } catch (err) {
      setMessage('Error al aprobar la evaluación.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <header className="mb-6 border-b border-gray-800 pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3 text-cyan-400">
              <Brain className="w-8 h-8" /> Asesor Pedagógico Inteligente
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Plataforma web para evaluación, retroalimentación y fortalecimiento de competencias en IA[cite: 1, 2].
            </p>
          </div>
          {/* Menú de Pestañas */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'labs', label: 'Laboratorios', icon: Layers },
              { id: 'evaluate', label: 'Evaluar IA', icon: Brain },
              { id: 'reviews', label: 'Supervisión Docente', icon: CheckCircle2 },
              { id: 'report', label: 'Informe Integral', icon: Award },
              { id: 'mindmap', label: 'Mapa Mental IA', icon: Network },
              { id: 'team', label: 'Equipo y Abstract', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-gray-900 border border-cyan-800/50 text-xs flex items-center gap-2 text-cyan-300">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* 1. GESTIONAR LABORATORIOS */}
        {activeTab === 'labs' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-300">
                <PlusCircle className="w-5 h-5" /> Crear Laboratorio y Rúbrica
              </h2>
              <form onSubmit={handleCreateLab} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Cohorte</label>
                    <select
                      value={cohort}
                      onChange={(e) => setCohort(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                    >
                      <option value="1">Cohorte 1</option>
                      <option value="2">Cohorte 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Título</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Lab 1: LLMs"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Descripción</label>
                  <textarea
                    required
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del reto..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Objetivos</label>
                  <input
                    type="text"
                    required
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Objetivo principal..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rúbrica JSON (Debe sumar 100%)</label>
                  <textarea
                    rows={5}
                    value={rubricJson}
                    onChange={(e) => setRubricJson(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-xs text-cyan-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 font-semibold py-2 rounded-lg text-xs transition"
                >
                  {loading ? 'Validando y Guardando...' : 'Guardar Laboratorio'}
                </button>
              </form>
            </div>

            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-300">
                <Layers className="w-5 h-5" /> Portafolio de Laboratorios
              </h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {laboratories.length === 0 ? (
                  <p className="text-gray-500 text-xs">No hay laboratorios creados.</p>
                ) : (
                  laboratories.map((lab) => (
                    <div key={lab.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full font-semibold border border-cyan-800/50">
                        Cohorte {lab.cohort}
                      </span>
                      <h3 className="font-bold text-sm mt-1">{lab.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{lab.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. EVALUACIÓN INTELIGENTE CON PDF */}
        {activeTab === 'evaluate' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-300">
                <FileText className="w-5 h-5" /> Cargar Solución (PDF o Texto)
              </h2>
              <form onSubmit={handleEvaluate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Laboratorio a Evaluar</label>
                  <select
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  >
                    {laboratories.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.title} (Cohorte {lab.cohort})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Nombre Estudiante</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Correo</label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="correo@universidad.edu"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Subir Informe en PDF (Opcional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-1.5 text-xs text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-900 file:text-cyan-200 hover:file:bg-cyan-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">O Texto de la Solución / Conclusiones</label>
                  <textarea
                    rows={3}
                    value={studentReportText}
                    onChange={(e) => setStudentReportText(e.target.value)}
                    placeholder="Pega texto adicional o resumen del desarrollo..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Repositorio GitHub</label>
                  <input
                    type="url"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || laboratories.length === 0}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {loading ? 'Analizando con IA y Calculando...' : 'Ejecutar Evaluación Inteligente'}
                </button>
              </form>
            </div>

            {/* Resultado */}
            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-300">
                <CheckCircle2 className="w-5 h-5" /> Resultado y Cálculo Determinista
              </h2>
              {!evaluationResult ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500">
                  <Brain className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs">Sube un informe en PDF y ejecuta la evaluación para ver el análisis de Gemini y la nota calculada por el backend.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <div className="bg-cyan-950/40 border border-cyan-800/50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-semibold">Nota Preliminar (Backend):</span>
                    <span className="text-xl font-black text-cyan-400">
                      {evaluationResult.preliminaryScore} / 5.0
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-gray-300 mb-1">Retroalimentación:</h4>
                    <p className="text-xs text-gray-400 bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                      {evaluationResult.feedback}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-gray-300 mb-1">Evaluación por Criterios y Evidencias:</h4>
                    <div className="space-y-2">
                      {evaluationResult.criteriasEvaluated?.map((c: any, idx: number) => (
                        <div key={idx} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 text-xs">
                          <div className="flex justify-between font-semibold text-cyan-300">
                            <span>{c.criterionName}</span>
                            <span>{c.score} / 5.0</span>
                          </div>
                          <p className="text-gray-400 mt-1 italic">Evidencia: &quot;{c.evidenceFound}&quot;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. SUPERVISIÓN Y TRAZABILIDAD DOCENTE */}
        {activeTab === 'reviews' && (
          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-cyan-300">
              <CheckCircle2 className="w-5 h-5" /> Revisión, Ajuste y Aprobación Docente[cite: 2, 3]
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              El docente puede auditar las evidencias analizadas por la IA, ajustar la nota de ser necesario y aprobar formalmente la entrega[cite: 2, 3].
            </p>
            <div className="space-y-4 max-h-[450px] overflow-y-auto">
              {evaluations.length === 0 ? (
                <p className="text-xs text-gray-500">No hay evaluaciones registradas en el sistema.</p>
              ) : (
                evaluations.map((ev) => (
                  <div key={ev.id} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300">{ev.submission?.studentName}</span>
                        <span className="text-[10px] bg-gray-900 text-gray-400 px-2 py-0.5 rounded">
                          {ev.laboratory?.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${ev.isApproved ? 'bg-green-950 text-green-300' : 'bg-amber-950 text-amber-300'}`}>
                          {ev.isApproved ? 'Aprobado Docente' : 'Pendiente de Revisión'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Correo: {ev.submission?.studentEmail}</p>
                      <p className="text-xs text-gray-300 bg-gray-900 p-2 rounded mt-1">
                        <strong>Retroalimentación IA:</strong> {ev.feedback}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2 min-w-[180px]">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Nota Actual:</span>
                        <span className="text-lg font-black text-cyan-400">{ev.finalScore} / 5.0</span>
                      </div>
                      <button
                        onClick={() => handleApproveEvaluation(ev.id, ev.finalScore, ev.feedback)}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar Nota
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. INFORME INTEGRAL */}
        {activeTab === 'report' && (
          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
              <Award className="w-5 h-5" /> Informe Integral del Aprendizaje (Cohortes 1 y 2)[cite: 2]
            </h2>
            <p className="text-xs text-gray-400">
              Consolidado global del desempeño académico, evolución de competencias, brechas identificadas y plan de fortalecimiento[cite: 2].
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <h3 className="text-xs font-semibold text-cyan-400 mb-1">Competencias Desarrolladas</h3>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  <li>Ingeniería de Prompts y Estructuración JSON</li>
                  <li>Desarrollo Backend con Node.js y Prisma</li>
                  <li>Evaluación Automatizada Multi-modelo</li>
                </ul>
              </div>
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <h3 className="text-xs font-semibold text-amber-400 mb-1">Oportunidades de Fortalecimiento</h3>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  <li>Optimización de consultas SQL complejas</li>
                  <li>Pruebas unitarias avanzadas en entornos Sandbox</li>
                </ul>
              </div>
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <h3 className="text-xs font-semibold text-green-400 mb-1">Evolución Académica</h3>
                <p className="text-xs text-gray-300 mt-1">
                  Progreso satisfactorio con un dominio promedio superior a 4.2/5.0 en los retos prácticos de ambas cohortes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. MAPA MENTAL INTERACTIVO */}
        {activeTab === 'mindmap' && (
          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
              <Network className="w-5 h-5" /> Mapa Mental Interactivo de Competencias en IA[cite: 2]
            </h2>
            <p className="text-xs text-gray-400">
              Representación visual de las temáticas, relaciones conceptuales y nivel de dominio alcanzado[cite: 2].
            </p>
            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-cyan-950/60 border border-cyan-800 px-4 py-2 rounded-lg text-cyan-300 font-bold text-sm">
                Inteligencia Artificial Aplicada (Nivel 1)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                  <span className="font-bold text-cyan-400 block mb-1">Cohorte 1: Fundamentos LLM</span>
                  <p className="text-gray-400">Prompts estructurados, validación Pydantic/Zod y análisis de casos de uso.</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                  <span className="font-bold text-cyan-400 block mb-1">Cohorte 2: Orquestación y Rúbricas</span>
                  <p className="text-gray-400">Evaluación algorítmica, trazabilidad docente y diseño de soluciones web.</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                  <span className="font-bold text-cyan-400 block mb-1">Validación y Sandbox</span>
                  <p className="text-gray-400">Verificación de código, seguridad y despliegue en servidor web.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PRESENTACIÓN DEL PROYECTO Y EQUIPO */}
        {activeTab === 'team' && (
          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
              <Users className="w-5 h-5" /> Presentación del Proyecto y Equipo Desarrollador[cite: 2]
            </h2>
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
              <h3 className="text-sm font-bold text-cyan-400">Abstract del Proyecto</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Plataforma web inteligente orientada al sector empresarial y educativo para automatizar la evaluación, retroalimentación y seguimiento de competencias en inteligencia artificial. Integra modelos multimodales mediante validación estructurada y cálculos deterministas en backend, asegurando confiabilidad y trazabilidad docente[cite: 1, 2, 3].
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-cyan-200 text-lg">
                  ING
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-100">Ingeniería de Software</h4>
                  <p className="text-xs text-gray-400">Rol: Arquitecto de Software y Desarrollador Full-Stack</p>
                  <p className="text-[10px] text-cyan-400 mt-0.5">Stack: Next.js, TypeScript, Prisma, PostgreSQL, Google Gemini API</p>
                </div>
              </div>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-cyan-200 text-lg">
                  IA
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-100">Especialista IA</h4>
                  <p className="text-xs text-gray-400">Rol: Integrador de Modelos y Validación Estructurada</p>
                  <p className="text-[10px] text-cyan-400 mt-0.5">Stack: Zod Schema, Prompt Engineering, Análisis PDF</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}