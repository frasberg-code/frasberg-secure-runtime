import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Wallet, Send, Download, RefreshCw, Shield, Key,
  TrendingUp, TrendingDown, Copy, QrCode, Eye, EyeOff, Lock,
  Smartphone, HardDrive, Plus, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

const CryptoWalletPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showBalance, setShowBalance] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  
  // Mock portfolio data
  const portfolio = {
    totalValue: 15420.50,
    change24h: 3.42,
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', balance: 0.234, value: 9876.54, change: 2.5, icon: '₿' },
      { symbol: 'ETH', name: 'Ethereum', balance: 2.5, value: 4320.00, change: -1.2, icon: 'Ξ' },
      { symbol: 'SOL', name: 'Solana', balance: 15, value: 1223.96, change: 8.3, icon: '◎' },
    ]
  };

  // Mock transactions
  const transactions = [
    { id: 1, type: 'receive', asset: 'BTC', amount: 0.05, date: '2024-02-04', status: 'completed' },
    { id: 2, type: 'send', asset: 'ETH', amount: 0.5, date: '2024-02-03', status: 'completed' },
    { id: 3, type: 'receive', asset: 'SOL', amount: 10, date: '2024-02-02', status: 'completed' },
  ];

  const copyAddress = () => {
    navigator.clipboard.writeText('0x1234...5678');
    toast.success('Address copied to clipboard');
  };

  const handleSend = () => {
    if (!sendAmount || !sendAddress) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Transaction submitted. Awaiting 2FA confirmation.');
    setShow2FASetup(true);
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
            Crypto Wallet
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            Secure multi-chain wallet
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShow2FASetup(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Security
        </Button>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        {/* Portfolio Overview */}
        <Card className={cn("mb-6", isDark ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-[#2a2a2c]" : "bg-gradient-to-br from-purple-100 to-blue-100")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>Total Balance</p>
                <div className="flex items-center gap-3">
                  <h2 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {showBalance ? `$${portfolio.totalValue.toLocaleString()}` : '••••••'}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)}>
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className={cn("flex items-center gap-1 mt-1", portfolio.change24h >= 0 ? "text-green-500" : "text-red-500")}>
                  {portfolio.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{portfolio.change24h >= 0 ? '+' : ''}{portfolio.change24h}% (24h)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Download className="h-4 w-4 mr-2" />
                  Receive
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: QrCode, label: 'Receive' },
                { icon: Send, label: 'Send' },
                { icon: RefreshCw, label: 'Swap' },
                { icon: Plus, label: 'Buy' },
              ].map(action => (
                <button
                  key={action.label}
                  className={cn(
                    "p-3 rounded-xl text-center transition-colors",
                    isDark ? "bg-white/10 hover:bg-white/20" : "bg-white/50 hover:bg-white/70"
                  )}
                >
                  <action.icon className={cn("h-5 w-5 mx-auto mb-1", isDark ? "text-white" : "text-gray-900")} />
                  <span className={cn("text-xs", isDark ? "text-white" : "text-gray-900")}>{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'portfolio', label: 'Assets' },
            { id: 'send', label: 'Send' },
            { id: 'transactions', label: 'History' },
            { id: 'security', label: 'Security' },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-purple-600' : ''}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Your Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio.assets.map(asset => (
                  <div
                    key={asset.symbol}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark ? "bg-[#1a1a1c] hover:bg-[#252527]" : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                      isDark ? "bg-[#2a2a2c]" : "bg-white"
                    )}>
                      {asset.icon}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-medium", isDark ? "text-white" : "")}>{asset.name}</p>
                      <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                        {asset.balance} {asset.symbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-medium", isDark ? "text-white" : "")}>${asset.value.toLocaleString()}</p>
                      <p className={cn("text-sm", asset.change >= 0 ? "text-green-500" : "text-red-500")}>
                        {asset.change >= 0 ? '+' : ''}{asset.change}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Send Tab */}
        {activeTab === 'send' && (
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Send Crypto</CardTitle>
              <CardDescription>Transfer assets securely</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={cn("text-sm mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                  Recipient Address
                </label>
                <Input
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                />
              </div>
              <div>
                <label className={cn("text-sm mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                  Amount
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className={cn("flex-1", isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : "")}
                  />
                  <Button variant="outline">Max</Button>
                </div>
              </div>
              <div className={cn("p-3 rounded-lg", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? "text-[#a0a0a0]" : "text-gray-600"}>Network Fee</span>
                  <span className={isDark ? "text-white" : ""}>~$2.50</span>
                </div>
              </div>
              <Button onClick={handleSend} className="w-full bg-purple-600">
                <Lock className="h-4 w-4 mr-2" />
                Send with 2FA
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg",
                      isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      tx.type === 'receive' ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {tx.type === 'receive' ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-medium capitalize", isDark ? "text-white" : "")}>{tx.type}</p>
                      <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-medium", tx.type === 'receive' ? "text-green-500" : "text-red-500")}>
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.asset}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "")}>
                  <Smartphone className="h-5 w-5" />
                  2FA Authentication
                </CardTitle>
                <CardDescription>Secure your account with two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn("p-4 rounded-lg text-center", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                  <QrCode className="h-32 w-32 mx-auto mb-3 text-purple-500" />
                  <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    Scan with your authenticator app
                  </p>
                </div>
                <Input placeholder="Enter 6-digit code" className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""} />
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>
            
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "")}>
                  <HardDrive className="h-5 w-5" />
                  Hardware Wallet
                </CardTitle>
                <CardDescription>Connect your hardware wallet for enhanced security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Ledger', status: 'Not connected' },
                  { name: 'Trezor', status: 'Not connected' },
                ].map(hw => (
                  <div
                    key={hw.name}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className={cn("font-medium", isDark ? "text-white" : "")}>{hw.name}</p>
                        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{hw.status}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                ))}
                
                <div className={cn("p-3 rounded-lg border", isDark ? "border-yellow-500/30 bg-yellow-500/10" : "border-yellow-300 bg-yellow-50")}>
                  <p className={cn("text-sm", isDark ? "text-yellow-400" : "text-yellow-700")}>
                    Hardware wallets provide the highest level of security for your assets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoWalletPage;
