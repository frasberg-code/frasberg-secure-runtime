import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, BookOpen, Code, CheckCircle } from 'lucide-react';

const LearningModulesPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [selectedModule, setSelectedModule] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  
  const modules = [
    {
      id: 'python',
      title: 'Python Basics',
      description: 'Learn Python fundamentals',
      lessons: ['Variables', 'Functions', 'Loops'],
      quiz: [
        { q: 'What is Python?', options: ['A snake', 'A programming language', 'A game'], answer: 1 },
        { q: 'How to define a function?', options: ['function()', 'def name():', 'fn name()'], answer: 1 }
      ]
    },
    {
      id: 'ai',
      title: 'AI Introduction',
      description: 'Understanding AI concepts',
      lessons: ['What is AI?', 'Machine Learning', 'Neural Networks'],
      quiz: [
        { q: 'What is ML?', options: ['Machine Language', 'Machine Learning', 'Module Loading'], answer: 1 }
      ]
    }
  ];
  
  const calculateScore = () => {
    if (!selectedModule) return 0;
    let correct = 0;
    selectedModule.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) correct++;
    });
    return Math.round((correct / selectedModule.quiz.length) * 100);
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0b]" : "bg-gray-50")}>
      <div className={cn("border-b px-4 py-3 flex items-center gap-4", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <Button variant="ghost" size="icon" onClick={() => selectedModule ? setSelectedModule(null) : navigate('/chat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
          {selectedModule ? selectedModule.title : 'Learning Modules'}
        </h1>
      </div>
      
      <div className="p-4 max-w-4xl mx-auto">
        {!selectedModule ? (
          <div className="grid grid-cols-2 gap-4">
            {modules.map(m => (
              <Card 
                key={m.id} 
                className={cn("cursor-pointer hover:scale-[1.02] transition-transform", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}
                onClick={() => { setSelectedModule(m); setQuizAnswers({}); setShowResults(false); }}
              >
                <CardContent className="p-6">
                  <BookOpen className="h-8 w-8 text-purple-500 mb-3" />
                  <h3 className={cn("font-semibold mb-2", isDark ? "text-white" : "")}>{m.title}</h3>
                  <p className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>{m.description}</p>
                  <p className={cn("text-xs mt-2", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    {m.lessons.length} lessons • {m.quiz.length} quiz questions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lessons */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedModule.lessons.map((lesson, i) => (
                  <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg mb-2", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className={isDark ? "text-white" : ""}>{lesson}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Quiz */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedModule.quiz.map((q, qi) => (
                  <div key={qi} className="mb-6">
                    <p className={cn("font-medium mb-3", isDark ? "text-white" : "")}>{qi + 1}. {q.q}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => !showResults && setQuizAnswers(prev => ({...prev, [qi]: oi}))}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            showResults && oi === q.answer ? "bg-green-500/20 border-green-500" :
                            showResults && quizAnswers[qi] === oi ? "bg-red-500/20 border-red-500" :
                            quizAnswers[qi] === oi ? "bg-purple-500/20 border-purple-500" :
                            isDark ? "border-[#2a2a2c] hover:border-[#3a3a3c]" : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span className={isDark ? "text-white" : ""}>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {!showResults ? (
                  <Button 
                    onClick={() => setShowResults(true)} 
                    className="w-full bg-purple-600"
                    disabled={Object.keys(quizAnswers).length < selectedModule.quiz.length}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <div className={cn("p-4 rounded-lg text-center", calculateScore() >= 70 ? "bg-green-500/20" : "bg-red-500/20")}>
                    <p className={cn("text-xl font-bold", isDark ? "text-white" : "")}>Score: {calculateScore()}%</p>
                    <p className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                      {calculateScore() >= 70 ? 'Great job!' : 'Keep practicing!'}
                    </p>
                    <Button onClick={() => { setQuizAnswers({}); setShowResults(false); }} variant="outline" className="mt-3">
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningModulesPage;
