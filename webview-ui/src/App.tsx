import React, { useEffect, useState } from 'react';
import './App.css';
import { ReviewDashboard } from './ReviewDashboard';

// 型定義
interface ChatMessage { id: number; role: 'user' | 'assistant'; content: string; created_at: string; }
interface Review { id: number; review_content: string; created_at: string; chat_messages: ChatMessage[]; }

function App() {
  const [review, setReview] = useState<Review | null>(null);
  const [viewState, setViewState] = useState<'welcome' | 'loading' | 'review' | 'error'>('welcome');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'showWelcome':
          setViewState('welcome');
          break;
        case 'showLoading':
          setViewState('loading');
          break;
        case 'showReview':
          setReview(message.payload);
          setViewState('review');
          break;
        case 'showError':
          setErrorMessage(message.payload);
          setViewState('error');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const renderContent = () => {
    switch (viewState) {
      case 'welcome':
        return (
          <div className="app-state">
            <h1>Refix AI Partner</h1>
            <p>エディタでコードを選択し、右クリックから「Refixでレビュー」を実行してください。</p>
          </div>
        );
      case 'loading':
        return (
           <div className="app-state">
            <h1>レビューを生成中...</h1>
            <p>AIがあなたのコードを分析しています。しばらくお待ちください。</p>
          </div>
        );
      case 'error':
        return (
          <div className="app-state">
            <h1>エラーが発生しました</h1>
            <p className="error-message">{errorMessage}</p>
          </div>
        );
      case 'review':
        if (!review) return null;
        return (
          <div className="review-container">
            <p className="text-sm text-gray-500 mb-4">
              Review generated on: {new Date(review.created_at).toLocaleString('ja-JP')}
            </p>
            <ReviewDashboard review={review} />
          </div>
        );
    }
  };

  return <div className="app">{renderContent()}</div>;
}

export default App;