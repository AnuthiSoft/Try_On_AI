// WalletDashboard.jsx - PRODUCTION READY VERSION
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSync, faPlus, faHistory, faExchangeAlt,
  faDownload, faArrowUp, faArrowDown,
  faWallet, faCoins, faChartLine,
  faReceipt, faCalendarAlt, faCheckCircle,
  faInfoCircle, faGift, faCreditCard,
  faRocket, faFire, faCrown, faStar, faBolt, faGem,
  faTimes, faSearch, faImage, faUserTie, faRobot,
  faExpandAlt, faRulerCombined, faLayerGroup, faCog, faTag
} from '@fortawesome/free-solid-svg-icons';
import './Wallet.css';
import api from "../../Services/api";

const Wallet = () => {
  
  const [wallet, setWallet] = useState({ 
    credits: 0,
    total_spent: 0,
    avg_transaction: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Credit packages with attractive bonuses
  const creditPackages = [
    { 
      amount: 100, 
      label: 'Starter', 
      icon: faStar, 
      color: '#667eea', 
      bonus: 0,
      popular: false,
      description: 'Perfect for beginners'
    },
    { 
      amount: 500, 
      label: 'Pro', 
      icon: faBolt, 
      color: '#10b981', 
      bonus: 50,
      popular: true,
      description: 'Most popular choice'
    },
    { 
      amount: 1000, 
      label: 'Premium', 
      icon: faCrown, 
      color: '#f59e0b', 
      bonus: 150,
      popular: false,
      description: 'For power users'
    },
    { 
      amount: 2500, 
      label: 'VIP', 
      icon: faGem, 
      color: '#8b5cf6', 
      bonus: 500,
      popular: false,
      description: 'Maximum benefits'
    },
  ];

  // Get transaction display title based on reason
  const getTransactionTitle = (reason) => {
    switch(reason?.toLowerCase()) {
      case 'virtual_tryon':
        return 'Virtual Try-On';
      case 'model_generation':
        return 'AI Model Generation';
      case 'image_generation':
        return 'Image Generation';
      default:
        return reason ? reason.replace(/_/g, ' ').toUpperCase() : 'Transaction';
    }
  };

  // Get job name for display (only for virtual try-on)
  const getJobName = (transaction) => {
    const { reason, metadata, job_name } = transaction;
    
    if (reason?.toLowerCase() === 'virtual_tryon') {
      return metadata?.job_name || job_name || null;
    }
    return null;
  };

  // Get transaction type icon and color
  const getTransactionTypeInfo = (reason) => {
    switch(reason?.toLowerCase()) {
      case 'virtual_tryon':
        return {
          icon: faUserTie,
          color: '#8b5cf6',
          label: 'Virtual Try-On',
          bgColor: 'rgba(139, 92, 246, 0.1)'
        };
      case 'model_generation':
        return {
          icon: faRobot,
          color: '#10b981',
          label: 'AI Model Generation',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'image_generation':
        return {
          icon: faImage,
          color: '#3b82f6',
          label: 'Image Generation',
          bgColor: 'rgba(59, 130, 246, 0.1)'
        };
      default:
        return {
          icon: faReceipt,
          color: '#6b7280',
          label: 'Transaction',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  // Parse job details from transaction
  const parseJobDetails = (transaction) => {
    const { reason, metadata, images_generated, cost_per_image, amount_rs } = transaction;
    const typeInfo = getTransactionTypeInfo(reason);
    
    let details = {
      type: typeInfo.label,
      icon: typeInfo.icon,
      color: typeInfo.color,
      bgColor: typeInfo.bgColor,
      items: []
    };

    // Add basic amount info
    details.items.push({
      label: 'Amount',
      value: `${amount_rs || transaction.credits || 0} credits`,
      icon: faCoins
    });

    // Parse based on reason
    switch(reason?.toLowerCase()) {
      case 'virtual_tryon':
        // Get job name from metadata or direct field
        const tryonJobName = getJobName(transaction);
        if (tryonJobName) {
          details.items.push({
            label: 'Job Name',
            value: tryonJobName,
            icon: faTag
          });
        }
        
        details.items.push(
          {
            label: 'Quality',
            value: metadata?.quality || 'Standard',
            icon: faCog
          },
          {
            label: 'Images Generated',
            value: images_generated || metadata?.total_images || 0,
            icon: faLayerGroup
          },
          {
            label: 'Cost per Image',
            value: `${cost_per_image || metadata?.credit_per_image || 0} credits`,
            icon: faCoins
          },
          {
            label: 'Image Size',
            value: transaction.image_size || metadata?.image_size || 'N/A',
            icon: faExpandAlt
          }
        );
        break;

      case 'model_generation':
        details.items.push(
          {
            label: 'Model Size',
            value: metadata?.size || '1024x1024',
            icon: faExpandAlt
          }
        );
        
        // Add Job ID if available
        if (metadata?.job_id) {
          details.items.push({
            label: 'Job ID',
            value: metadata.job_id,
            icon: faReceipt
          });
        }
        break;

      default:
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            details.items.push({
              label: key.replace(/_/g, ' ').toUpperCase(),
              value: value.toString(),
              icon: faInfoCircle
            });
          });
        }
    }

    return details;
  };

  // Calculate stats from transactions
  const calculateStats = (txns) => {
    if (!txns || txns.length === 0) {
      return { totalSpent: 0, avgTransaction: 0 };
    }

    const debitTransactions = txns.filter(txn => {
      const type = txn.type?.toLowerCase() || '';
      const amount = txn.credits || 0;
      
      return type.includes('debit') || 
             type.includes('spent') || 
             type.includes('purchase') ||
             type.includes('tryon') ||
             type.includes('generation') ||
             type.includes('connection') ||
             amount < 0;
    });

    if (debitTransactions.length === 0) {
      return { totalSpent: 0, avgTransaction: 0 };
    }

    const totalSpent = debitTransactions.reduce((sum, txn) => {
      const amount = Math.abs(txn.credits || 0);
      return sum + amount;
    }, 0);

    const avgTransaction = Math.round(totalSpent / debitTransactions.length);

    return { totalSpent, avgTransaction };
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Update stats when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const { totalSpent, avgTransaction } = calculateStats(transactions);
      setWallet(prev => ({
        ...prev,
        total_spent: totalSpent,
        avg_transaction: avgTransaction
      }));
    }
  }, [transactions]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view your wallet");
        setLoading(false);
        return;
      }

      // Fetch wallet balance
      const walletResponse = await api.get("/wallet");
      const walletData = walletResponse.data || {};

      // Fetch transactions
      let transactionsData = [];
      try {
        const txnResponse = await api.get("/wallet/transactions");
        transactionsData = txnResponse.data || [];
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Unable to load transaction history");
      }

      const { totalSpent, avgTransaction } = calculateStats(transactionsData);

      setWallet({
        credits: walletData.credits || 0,
        total_spent: totalSpent,
        avg_transaction: avgTransaction
      });

      setTransactions(transactionsData);

    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError(err.response?.data?.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    try {
      setIsProcessing(true);
      setError("");

      await api.post(
        `/payments/add-credits`,
        null,
        { params: { credits: creditAmount } }
      );

      await fetchWalletData();

      setSuccessMessage(`Successfully added ${creditAmount} credits!`);
      setShowAddCredits(false);

      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to add credits"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount || 0);
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return "N/A";

    const utcDate =
      createdAt instanceof Date
        ? new Date(createdAt.toISOString())
        : new Date(
            typeof createdAt === "string" && !createdAt.endsWith("Z")
              ? createdAt + "Z"
              : createdAt
          );

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(utcDate);
  };

  // Determine if transaction is debit
  const isTransactionDebit = (transaction) => {
    const transactionType = transaction.type?.toLowerCase() || '';
    const transactionAmount = transaction.credits || 0;
    
    if (transactionType.includes('debit') || 
        transactionType.includes('withdrawal') ||
        transactionType.includes('spent') ||
        transactionType.includes('purchase') ||
        transactionType.includes('tryon') ||
        transactionType.includes('generation') ||
        transactionType.includes('connection')) {
      return true;
    }
    
    if (transactionAmount < 0) {
      return true;
    }
    
    return false;
  };

  // Filter transactions based on filter and search
  const filteredTransactions = transactions.filter(txn => {
    const isDebit = isTransactionDebit(txn);
    const matchesSearch = searchTerm === '' || 
      txn.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.metadata?.job_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (txn.job_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'credit') return !isDebit && matchesSearch;
    if (filter === 'debit') return isDebit && matchesSearch;
    
    return matchesSearch;
  });

  // Handle transaction click to show details
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  // Refresh wallet data
  const refreshWallet = () => {
    fetchWalletData();
  };

  if (loading) {
    return (
      <div className="wallet-loading">
        <div className="loading-content">
          <div className="spinner">
            <FontAwesomeIcon icon={faSync} spin />
          </div>
          <h3>Loading Your Wallet</h3>
          <p>Fetching your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-title-wrapper">
            <div className="wallet-icon">
              <FontAwesomeIcon icon={faWallet} />
            </div>
            <div>
              <h1 className="gradient-text">Wallet Dashboard</h1>
              <p className="subtitle">
                <FontAwesomeIcon icon={faCoins} /> 
                Manage your credits and track expenses
              </p>
            </div>
          </div>
        </div>
        <div className="header-right">
          
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="alert success">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert error">
          <FontAwesomeIcon icon={faTimes} />
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Left Column */}
        <div className="left-column">
          {/* Balance Card */}
          <div className="balance-card">
            <div className="card-header">
              <div className="card-title">
                <h2>Available Balance</h2>
                <p className="card-subtitle">Total credits in your wallet</p>
              </div>
              <div className="user-badge">
                <span>BASIC</span>
              </div>
            </div>

            <div className="balance-display">
              <div className="balance-main">
                <span className="balance-amount">
                  {formatCurrency(wallet?.credits)}
                </span>
                <span className="balance-label">Credits</span>
              </div>
            </div>

            <div className="balance-actions">
              <button 
                className="btn-primary" 
                onClick={() => setShowAddCredits(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Credits</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <FontAwesomeIcon icon={faWallet} />
              </div>
              <div className="stat-content">
                <p className="stat-value">{formatCurrency(wallet?.total_spent)}</p>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <FontAwesomeIcon icon={faReceipt} />
              </div>
              <div className="stat-content">
                <p className="stat-value">{transactions.length}</p>
                <span className="stat-label">Transactions</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="stat-content">
                <p className="stat-value">{formatCurrency(wallet?.avg_transaction)}</p>
                <span className="stat-label">Avg. Spend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="right-column">
          <div className="section-header">
            <h2>
              <FontAwesomeIcon icon={faHistory} style={{ marginRight: '10px' }} />
              <span>Transaction History</span>
            </h2>
            <div className="header-actions">
              <div className="search-box">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filter === 'credit' ? 'active' : ''}`}
                  onClick={() => setFilter('credit')}
                >
                  <FontAwesomeIcon icon={faArrowDown} /> Credits
                </button>
                <button 
                  className={`filter-btn ${filter === 'debit' ? 'active' : ''}`}
                  onClick={() => setFilter('debit')}
                >
                  <FontAwesomeIcon icon={faArrowUp} /> Debits
                </button>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {filteredTransactions.length > 0 && (
            <div className="filter-summary">
              Showing {filteredTransactions.length} 
              {filter === 'all' ? ' transactions' : 
               filter === 'credit' ? ' credit transactions' : ' debit transactions'}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}

          <div className="transactions-list">
            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FontAwesomeIcon icon={faCoins} />
                </div>
                <h3>
                  {searchTerm ? 'No matching transactions' : 
                   filter === 'all' ? 'No transactions yet' :
                   filter === 'credit' ? 'No credit transactions' : 'No debit transactions'}
                </h3>
                <p>
                  {searchTerm ? 'Try a different search term' : 
                   'Your transaction history will appear here'}
                </p>
                {(searchTerm || filter !== 'all') && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                    style={{ marginTop: '15px' }}
                  >
                    Clear Filters
                  </button>
                )}
                {filter === 'all' && !searchTerm && (
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowAddCredits(true)}
                    style={{ marginTop: '20px' }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Your First Credits
                  </button>
                )}
              </div>
            ) : (
              filteredTransactions.map((txn, index) => {
                const isDebit = isTransactionDebit(txn);
                const isCredit = !isDebit;
                const displayAmount = Math.abs(txn.credits || 0);
                const typeInfo = getTransactionTypeInfo(txn.reason);
                const title = getTransactionTitle(txn.reason);
                const heading = getTransactionTitle(txn.type);

                const jobName = getJobName(txn);

                return (
                  <div 
                    key={txn._id || index} 
                    className={`transaction-item ${isCredit ? 'credit' : 'debit'} clickable`}
                    onClick={() => handleTransactionClick(txn)}
                  >
                    <div className="transaction-icon">
                      <div 
                        className="icon-wrapper" 
                        style={{ 
                          background: typeInfo.bgColor,
                          color: typeInfo.color
                        }}
                      >
                        <FontAwesomeIcon icon={typeInfo.icon} />
                      </div>
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-main">
                        <h4>
                          {txn.reason === "model_generation_failed" ? "Refund" : title}
                        </h4>

                        {jobName && (
                          <p className="transaction-job">
                            {jobName}
                          </p>
                        )}
                      </div>
                      <div className="transaction-meta">
                        <span className="transaction-date">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {formatDate(txn.created_at)}
                        </span>
                        {(txn.image_size || txn.metadata?.image_size) && (
                            <span className="transaction-size">
                              <FontAwesomeIcon icon={faExpandAlt} />
                              {txn.image_size || txn.metadata?.image_size}
                            </span>
                          )}

                      </div>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(displayAmount)}
                      </span>
                      <div className={`amount-label ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? 'Credits Added' : 'Credits Used'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowTransactionDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon 
                  icon={getTransactionTypeInfo(selectedTransaction.reason).icon} 
                  style={{ marginRight: '10px', color: getTransactionTypeInfo(selectedTransaction.reason).color }}
                />
                Transaction Details
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setShowTransactionDetails(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transaction-detail-card">
                <div className="detail-header">
                  <div className="detail-type">
                    <div 
                      className="type-icon"
                      style={{ 
                        background: getTransactionTypeInfo(selectedTransaction.reason).bgColor,
                        color: getTransactionTypeInfo(selectedTransaction.reason).color
                      }}
                    >
                      <FontAwesomeIcon icon={getTransactionTypeInfo(selectedTransaction.reason).icon} />
                    </div>
                    <div>
                      <h3>{getTransactionTitle(selectedTransaction.reason)}</h3>
                      <p className="transaction-id">ID: {selectedTransaction._id}</p>
                    </div>
                  </div>
                  <div className="detail-amount">
                    <span className={`amount ${isTransactionDebit(selectedTransaction) ? 'debit' : 'credit'}`}>
                      {isTransactionDebit(selectedTransaction) ? '-' : '+'}{Math.abs(selectedTransaction.credits || 0)} credits
                    </span>
                    <p className="amount-label">
                      {isTransactionDebit(selectedTransaction) ? 'DEBITED' : 'CREDITED'}
                    </p>
                  </div>
                </div>

                <div className="detail-info">
                  {parseJobDetails(selectedTransaction).items.map((item, idx) => (
                    <div key={idx} className="info-row">
                      <div className="info-label">
                        <FontAwesomeIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </div>
                      <div className="info-value">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="detail-footer">
                  <div className="timestamp">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{formatDate(selectedTransaction.created_at)}</span>
                  </div>
                  <div className="transaction-status">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981' }} />
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => setShowTransactionDetails(false)}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCredits && (
        <div className="modal-overlay" onClick={() => !isProcessing && setShowAddCredits(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faRocket} style={{ marginRight: '10px' }} />
                Add Credits
              </h2>
              <button 
                className="modal-close" 
                onClick={() => !isProcessing && setShowAddCredits(false)}
                disabled={isProcessing}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-subtitle">Choose a package or enter custom amount</p>
              
              {/* Credit Packages */}
              <div className="credit-packages">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.amount}
                    className={`credit-package ${creditAmount === pkg.amount ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                    onClick={() => !isProcessing && setCreditAmount(pkg.amount)}
                  >
                    {pkg.popular && (
                      <div className="popular-badge">
                        <FontAwesomeIcon icon={faFire} />
                        Most Popular
                      </div>
                    )}
                    <div className="package-header">
                      <div className="package-icon" style={{ background: pkg.color }}>
                        <FontAwesomeIcon icon={pkg.icon} />
                      </div>
                      <div className="package-info">
                        <span className="package-label">{pkg.label}</span>
                      </div>
                    </div>
                    <div className="package-amount">
                      <span className="credits">{formatCurrency(pkg.amount)}</span>
                      <span className="currency">credits</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="custom-amount">
                <label>Custom Amount:</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => !isProcessing && setCreditAmount(Number(e.target.value))}
                    min="10"
                    max="10000"
                    disabled={isProcessing}
                  />
                  <span className="input-suffix">credits</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="payment-section">
                <h3>
                  <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '10px' }} />
                  Payment Method
                </h3>
                <div className="payment-methods">
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      disabled={isProcessing}
                    />
                    <div className="option-content">
                      <div className="option-icon">
                        <FontAwesomeIcon icon={faCreditCard} />
                      </div>
                      <div className="option-info">
                        <span>Credit/Debit Card</span>
                        <small>Visa, Mastercard, Amex</small>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      disabled={isProcessing}
                    />
                    <div className="option-content">
                      <div className="option-icon">
                        <FontAwesomeIcon icon={faWallet} />
                      </div>
                      <div className="option-info">
                        <span>Digital Wallet</span>
                        <small>PayPal, Apple Pay, Google Pay</small>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Total Amount */}
              <div className="total-amount">
                <div className="total-label">Total Amount:</div>
                <div className="total-value">
                  {formatCurrency(creditAmount)} credits
                  {creditPackages.find(p => p.amount === creditAmount)?.bonus > 0 && (
                    <span className="bonus-text">
                      +{creditPackages.find(p => p.amount === creditAmount)?.bonus} bonus
                    </span>
                  )}
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="processing-indicator">
                  <FontAwesomeIcon icon={faSync} spin />
                  <span>Processing your payment...</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowAddCredits(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddCredits}
                disabled={isProcessing || creditAmount < 10}
              >
                {isProcessing ? (
                  <>
                    <FontAwesomeIcon icon={faSync} spin />
                    Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faRocket} />
                    Add {formatCurrency(creditAmount)} Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;