import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity,
  Bot, Play, Pause, Settings, RefreshCw, DollarSign, Percent,
  Clock, AlertTriangle, CheckCircle, XCircle, Zap
} from 'lucide-react';

const TradingPlatformPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('market');
  const [selectedPair, setSelectedPair] = useState('BTC/USD');
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [aiStrategyActive, setAiStrategyActive] = useState(false);
  const [paperTrading, setPaperTrading] = useState(true);
  
  // Mock market data
  const markets = [
    { pair: 'BTC/USD', price: 42150.00, change: 2.34, volume: '1.2B' },
    { pair: 'ETH/USD', price: 2280.50, change: -1.12, volume: '890M' },
    { pair: 'SOL/USD', price: 98.75, change: 5.67, volume: '450M' },
    { pair: 'XRP/USD', price: 0.52, change: -0.45, volume: '320M' },
  ];

  // AI Trading strategies
  const aiStrategies = [
    { id: 'momentum', name: 'Momentum', description: 'Follow market trends', risk: 'Medium', roi: '+12.5%' },
    { id: 'meanrev', name: 'Mean Reversion', description: 'Trade price extremes', risk: 'Low', roi: '+8.2%' },
    { id: 'grid', name: 'Grid Trading', description: 'Automated buy/sell grid', risk: 'Low', roi: '+6.8%' },
    { id: 'dca', name: 'DCA Bot', description: 'Dollar cost averaging', risk: 'Very Low', roi: '+15.3%' },
  ];

  // Mock open positions
  const positions = [
    { pair: 'BTC/USD', side: 'long', entry: 41500, current: 42150, pnl: 650, pnlPercent: 1.57 },
    { pair: 'ETH/USD', side: 'short', entry: 2350, current: 2280, pnl: 70, pnlPercent: 2.98 },
  ];

  // Mock order history
  const orderHistory = [
    { id: 1, pair: 'BTC/USD', type: 'market', side: 'buy', amount: 0.1, price: 41500, status: 'filled', time: '10:30' },
    { id: 2, pair: 'ETH/USD', type: 'limit', side: 'sell', amount: 1, price: 2350, status: 'filled', time: '09:15' },
    { id: 3, pair: 'SOL/USD', type: 'market', side: 'buy', amount: 10, price: 95, status: 'cancelled', time: '08:45' },
  ];

  const placeOrder = () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }
    
    if (paperTrading) {
      toast.success(`Paper trade: ${orderSide.toUpperCase()} ${amount} ${selectedPair} @ ${orderType === 'market' ? 'market price' : price}`);
    } else {
      toast.info('Live trading requires additional verification');
    }
  };

  const toggleAiStrategy = (strategyId) => {
    setAiStrategyActive(!aiStrategyActive);
    if (!aiStrategyActive) {
      toast.success(`AI Strategy "${strategyId}" activated`);
    } else {
      toast.info('AI Strategy paused');
    }
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0b]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("border-b px-4 py-3 flex items-center gap-4", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
            Sofia Trading Platform
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            AI-powered trading with paper trading mode
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>Paper Trading</span>
          <Button
            variant={paperTrading ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPaperTrading(!paperTrading)}
            className={paperTrading ? 'bg-green-600' : ''}
          >
            {paperTrading ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>
      
      <div className="p-4 max-w-7xl mx-auto">
        {/* Market Overview */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {markets.map(market => (
            <Card
              key={market.pair}
              onClick={() => setSelectedPair(market.pair)}
              className={cn(
                "cursor-pointer transition-all",
                selectedPair === market.pair && "ring-2 ring-purple-500",
                isDark ? "bg-[#0f0f10] border-[#2a2a2c] hover:border-[#3a3a3c]" : "hover:border-gray-300"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-medium", isDark ? "text-white" : "")}>{market.pair}</span>
                  {market.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "")}>${market.price.toLocaleString()}</p>
                <p className={cn("text-sm", market.change >= 0 ? "text-green-500" : "text-red-500")}>
                  {market.change >= 0 ? '+' : ''}{market.change}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'market', label: 'Trade', icon: Activity },
            { id: 'ai', label: 'AI Strategies', icon: Bot },
            { id: 'positions', label: 'Positions', icon: BarChart3 },
            { id: 'history', label: 'History', icon: Clock },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-purple-600' : ''}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'market' && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>{selectedPair} Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Chart Placeholder */}
                  <div className={cn(
                    "h-64 rounded-lg flex items-center justify-center mb-4",
                    isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                  )}>
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-purple-500" />
                      <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>Live chart integration coming soon</p>
                    </div>
                  </div>
                  
                  {/* Time frames */}
                  <div className="flex gap-2 justify-center">
                    {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                      <Button key={tf} variant="outline" size="sm">{tf}</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {aiStrategies.map(strategy => (
                  <Card key={strategy.id} className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            isDark ? "bg-purple-500/20" : "bg-purple-100"
                          )}>
                            <Bot className="h-6 w-6 text-purple-500" />
                          </div>
                          <div>
                            <h3 className={cn("font-semibold", isDark ? "text-white" : "")}>{strategy.name}</h3>
                            <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{strategy.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-500 font-semibold">{strategy.roi}</p>
                          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>Risk: {strategy.risk}</p>
                        </div>
                        <Button
                          onClick={() => toggleAiStrategy(strategy.id)}
                          className={aiStrategyActive ? 'bg-red-600' : 'bg-green-600'}
                        >
                          {aiStrategyActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {activeTab === 'positions' && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  {positions.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className={cn("h-12 w-12 mx-auto mb-3", isDark ? "text-[#3a3a3c]" : "text-gray-300")} />
                      <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>No open positions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {positions.map((pos, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg",
                            isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                          )}
                        >
                          <div>
                            <p className={cn("font-medium", isDark ? "text-white" : "")}>{pos.pair}</p>
                            <p className={cn("text-sm capitalize", pos.side === 'long' ? "text-green-500" : "text-red-500")}>
                              {pos.side}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>Entry</p>
                            <p className={isDark ? "text-white" : ""}>${pos.entry.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>Current</p>
                            <p className={isDark ? "text-white" : ""}>${pos.current.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={pos.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                              {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()}
                            </p>
                            <p className={cn("text-sm", pos.pnlPercent >= 0 ? "text-green-500" : "text-red-500")}>
                              {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%
                            </p>
                          </div>
                          <Button variant="outline" size="sm">Close</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'history' && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orderHistory.map(order => (
                      <div
                        key={order.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {order.status === 'filled' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className={cn("font-medium", isDark ? "text-white" : "")}>{order.pair}</p>
                            <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                              {order.type} • {order.time}
                            </p>
                          </div>
                        </div>
                        <div className={cn("text-sm", order.side === 'buy' ? "text-green-500" : "text-red-500")}>
                          {order.side.toUpperCase()} {order.amount}
                        </div>
                        <div className={isDark ? "text-white" : ""}>${order.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Order Panel */}
          <Card className={cn("h-fit", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Place Order</CardTitle>
              <CardDescription>{selectedPair}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setOrderSide('buy')}
                  className={cn(
                    "w-full",
                    orderSide === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-transparent border border-green-500 text-green-500"
                  )}
                >
                  Buy
                </Button>
                <Button
                  onClick={() => setOrderSide('sell')}
                  className={cn(
                    "w-full",
                    orderSide === 'sell' ? "bg-red-600 hover:bg-red-700" : "bg-transparent border border-red-500 text-red-500"
                  )}
                >
                  Sell
                </Button>
              </div>
              
              {/* Order Type */}
              <div className="flex gap-2">
                {['market', 'limit', 'stop'].map(type => (
                  <Button
                    key={type}
                    variant={orderType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrderType(type)}
                    className={orderType === type ? 'bg-purple-600' : ''}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
              
              {/* Price (for limit orders) */}
              {orderType !== 'market' && (
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    Price
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                  />
                </div>
              )}
              
              {/* Amount */}
              <div>
                <label className={cn("text-sm mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                  Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                />
                <div className="flex gap-2 mt-2">
                  {['25%', '50%', '75%', '100%'].map(pct => (
                    <Button key={pct} variant="outline" size="sm" className="flex-1">{pct}</Button>
                  ))}
                </div>
              </div>
              
              {/* Order Summary */}
              <div className={cn("p-3 rounded-lg space-y-2", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? "text-[#a0a0a0]" : "text-gray-600"}>Total</span>
                  <span className={isDark ? "text-white" : ""}>$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? "text-[#a0a0a0]" : "text-gray-600"}>Fee</span>
                  <span className={isDark ? "text-white" : ""}>$0.00</span>
                </div>
              </div>
              
              {/* Place Order Button */}
              <Button
                onClick={placeOrder}
                className={cn(
                  "w-full",
                  orderSide === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                <Zap className="h-4 w-4 mr-2" />
                {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedPair.split('/')[0]}
              </Button>
              
              {/* Paper Trading Notice */}
              {paperTrading && (
                <div className={cn("p-2 rounded-lg text-center", isDark ? "bg-yellow-500/10" : "bg-yellow-50")}>
                  <p className={cn("text-xs", isDark ? "text-yellow-400" : "text-yellow-700")}>
                    Paper Trading Mode - No real funds used
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradingPlatformPage;
