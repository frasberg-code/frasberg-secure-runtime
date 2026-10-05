import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Bot, Home, Lightbulb, Thermometer, Wind, Tv, 
  Battery, Wifi, Send, Play, RotateCcw, Grip,
  Sun, Moon, Coffee, Film, Music, BookOpen
} from 'lucide-react';

const HardwareControlPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState('smart-home');
  
  // Devices state
  const [devices, setDevices] = useState([
    { id: 'd1', name: 'Living Room Light', type: 'light', room: 'Living Room', status: 'on', brightness: 80, battery: 100, signal: 95 },
    { id: 'd2', name: 'Bedroom Light', type: 'light', room: 'Bedroom', status: 'off', brightness: 50, battery: 100, signal: 88 },
    { id: 'd3', name: 'Thermostat', type: 'thermostat', room: 'Living Room', status: 'on', temperature: 72, battery: 85, signal: 92 },
    { id: 'd4', name: 'Ceiling Fan', type: 'fan', room: 'Bedroom', status: 'on', speed: 2, battery: 100, signal: 90 },
  ]);
  
  // Robot state
  const [robot, setRobot] = useState({
    position: { x: 50, y: 50 },
    waypoints: [],
    speed: 50,
    gripperOpen: true,
    isMoving: false
  });
  
  // Scene presets
  const scenes = [
    { id: 'movie_night', name: 'Movie Night', icon: Film },
    { id: 'morning', name: 'Morning', icon: Sun },
    { id: 'sleep', name: 'Sleep', icon: Moon },
    { id: 'work', name: 'Work', icon: BookOpen },
  ];
  
  const executeScene = (sceneId) => {
    toast.success(`Scene "${sceneId}" activated!`);
    if (sceneId === 'movie_night') {
      setDevices(prev => prev.map(d => d.type === 'light' ? {...d, status: 'on', brightness: 20} : d));
    } else if (sceneId === 'sleep') {
      setDevices(prev => prev.map(d => d.type === 'light' ? {...d, status: 'off'} : d));
    }
  };
  
  const handleCommand = () => {
    if (!command.trim()) return;
    
    const cmd = command.toLowerCase();
    if (cmd.includes('movie')) {
      executeScene('movie_night');
    } else if (cmd.includes('light') && cmd.includes('off')) {
      setDevices(prev => prev.map(d => d.type === 'light' ? {...d, status: 'off'} : d));
      toast.success('Lights turned off');
    } else if (cmd.includes('light') && cmd.includes('on')) {
      setDevices(prev => prev.map(d => d.type === 'light' ? {...d, status: 'on'} : d));
      toast.success('Lights turned on');
    } else {
      toast.info('Command not recognized');
    }
    setCommand('');
  };
  
  const addWaypoint = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setRobot(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, { x, y, id: Date.now() }]
    }));
    toast.success(`Waypoint at (${x}, ${y})`);
  };
  
  const executeRobotPath = () => {
    if (robot.waypoints.length === 0) {
      toast.error('No waypoints');
      return;
    }
    setRobot(prev => ({ ...prev, isMoving: true }));
    toast.success('Robot moving...');
    setTimeout(() => {
      setRobot(prev => ({ 
        ...prev, 
        isMoving: false,
        position: prev.waypoints.length > 0 ? prev.waypoints[prev.waypoints.length - 1] : prev.position
      }));
      toast.success('Path complete!');
    }, 2000);
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0b]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("border-b px-4 py-3 flex items-center gap-4", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
          Hardware Control Center
        </h1>
      </div>
      
      <div className="p-4 max-w-6xl mx-auto">
        {/* Command Input */}
        <Card className={cn("mb-6", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="Try: movie night, turn lights off, etc."
                className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
              />
              <Button onClick={handleCommand} className="bg-purple-600">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['smart-home', 'robotics', 'monitoring'].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'bg-purple-600' : ''}
            >
              {tab === 'smart-home' ? 'Smart Home' : tab === 'robotics' ? 'Robotics' : 'Monitoring'}
            </Button>
          ))}
        </div>
        
        {/* Smart Home Tab */}
        {activeTab === 'smart-home' && (
          <div>
            {/* Scenes */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {scenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => executeScene(scene.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:scale-105",
                    isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "bg-white border-gray-200"
                  )}
                >
                  <scene.icon className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{scene.name}</p>
                </button>
              ))}
            </div>
            
            {/* Devices */}
            <div className="grid grid-cols-2 gap-4">
              {devices.map(device => (
                <Card key={device.id} className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={cn("font-medium", isDark ? "text-white" : "")}>{device.name}</p>
                        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{device.room}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={device.status === 'on' ? 'default' : 'outline'}
                        onClick={() => setDevices(prev => prev.map(d => 
                          d.id === device.id ? {...d, status: d.status === 'on' ? 'off' : 'on'} : d
                        ))}
                        className={device.status === 'on' ? 'bg-purple-600' : ''}
                      >
                        {device.status}
                      </Button>
                    </div>
                    {device.brightness !== undefined && (
                      <Slider
                        value={[device.brightness]}
                        onValueChange={([v]) => setDevices(prev => prev.map(d => 
                          d.id === device.id ? {...d, brightness: v} : d
                        ))}
                        max={100}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Robotics Tab */}
        {activeTab === 'robotics' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>2D Path Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className={cn("relative w-full h-64 rounded-lg border cursor-crosshair", isDark ? "bg-[#1a1a1c] border-[#2a2a2c]" : "bg-gray-100")}
                  onClick={addWaypoint}
                >
                  {/* Waypoints */}
                  {robot.waypoints.map((wp, i) => (
                    <div
                      key={wp.id}
                      className="absolute w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 text-[8px] text-white flex items-center justify-center"
                      style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                    >
                      {i + 1}
                    </div>
                  ))}
                  {/* Robot */}
                  <div
                    className={cn("absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all",
                      robot.isMoving ? "bg-green-500" : "bg-purple-500"
                    )}
                    style={{ left: `${robot.position.x}%`, top: `${robot.position.y}%` }}
                  >
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={executeRobotPath} className="flex-1 bg-purple-600">
                    <Play className="h-4 w-4 mr-2" />Execute
                  </Button>
                  <Button onClick={() => setRobot(prev => ({...prev, waypoints: []}))} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Robot Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn("text-xs", isDark ? "text-[#a0a0a0]" : "")}>X: {robot.position.x}</label>
                    <Slider value={[robot.position.x]} onValueChange={([v]) => setRobot(prev => ({...prev, position: {...prev.position, x: v}}))} max={100} />
                  </div>
                  <div>
                    <label className={cn("text-xs", isDark ? "text-[#a0a0a0]" : "")}>Y: {robot.position.y}</label>
                    <Slider value={[robot.position.y]} onValueChange={([v]) => setRobot(prev => ({...prev, position: {...prev.position, y: v}}))} max={100} />
                  </div>
                </div>
                <div>
                  <label className={cn("text-xs", isDark ? "text-[#a0a0a0]" : "")}>Speed: {robot.speed}%</label>
                  <Slider value={[robot.speed]} onValueChange={([v]) => setRobot(prev => ({...prev, speed: v}))} max={100} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-white" : ""}>Gripper</span>
                  <Button 
                    variant={robot.gripperOpen ? 'outline' : 'default'}
                    onClick={() => setRobot(prev => ({...prev, gripperOpen: !prev.gripperOpen}))}
                    className={!robot.gripperOpen ? 'bg-purple-600' : ''}
                  >
                    {robot.gripperOpen ? 'Open' : 'Closed'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="grid grid-cols-2 gap-4">
            {devices.map(device => (
              <Card key={device.id} className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardContent className="p-4">
                  <p className={cn("font-medium mb-2", isDark ? "text-white" : "")}>{device.name}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Battery className={device.battery > 50 ? "text-green-500" : "text-red-500"} size={16} />
                      <div className={cn("flex-1 h-2 rounded-full", isDark ? "bg-[#2a2a2c]" : "bg-gray-200")}>
                        <div className="h-full bg-green-500 rounded-full" style={{width: `${device.battery}%`}} />
                      </div>
                      <span className="text-xs">{device.battery}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className={device.signal > 70 ? "text-green-500" : "text-yellow-500"} size={16} />
                      <div className={cn("flex-1 h-2 rounded-full", isDark ? "bg-[#2a2a2c]" : "bg-gray-200")}>
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${device.signal}%`}} />
                      </div>
                      <span className="text-xs">{device.signal}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareControlPage;
