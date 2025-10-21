// src/pages/PlayGame/index.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, post, put } from '../../utils/request';
import {
  Layout, Typography, Card, Button, Space, Radio, Checkbox, Result,
  Spin, Progress, message, Image, Alert
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function PlayGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, answered, results, ended
  const [sessionId, setSessionId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [answerResult, setAnswerResult] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [lastQuestionId, setLastQuestionId] = useState(null);
  
  const timerIntervalRef = useRef(null);
  const statusIntervalRef = useRef(null);

  const clearAllIntervals = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  const checkAnsweredStatus = useCallback((playerId) => {
    console.log('Checking if player already answered...');
    get(`/play/${playerId}/answer`)
      .then(res => {
        console.log('Answer status response:', res);
        
        const answered = 
          (res && res.answered) || 
          (res && res.data && res.data.answered);
          
        if (answered) {
          console.log('Player has already answered');
          setGameStatus('answered');
          setAnswerResult(res.data || res);
        } else {
          console.log('Player has not answered yet');
        }
      })
      .catch(error => {
        console.error('Error checking answer status:', error);
      });
  }, []);

  const startTimer = useCallback((seconds) => {
    console.log(`Starting timer for ${seconds} seconds`);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    let remaining = seconds;
    setTimeRemaining(remaining);
    
    const interval = setInterval(() => {
      remaining -= 1;
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setGameStatus('results');
        checkAnsweredStatus(playerId);
      }
    }, 1000);
    
    timerIntervalRef.current = interval;
  }, [playerId, checkAnsweredStatus]);

  const fetchCurrentQuestion = useCallback((playerId) => {
    console.log('Fetching current question...');
    get(`/play/${playerId}/question`)
      .then(res => {
        console.log('Question response:', res);
        
        if (res) {
          const questionData = res.question || (res.data ? (res.data.question || res.data) : res);
          console.log('Processed question data:', questionData);
          
          const questionId = questionData.id || `${questionData.content}-${questionData.position || Math.random()}`;
          
          if (questionId !== lastQuestionId) {
            console.log('New question detected:', questionData);
            setLastQuestionId(questionId);
            setCurrentQuestion(questionData);
            setSelectedAnswers([]);
            setAnswerResult(null);
            setGameStatus('playing');
            
            const duration = questionData.duration || questionData.time || 30;
            if (duration) {
              startTimer(parseInt(duration));
            }
          } else {
            checkAnsweredStatus(playerId);
          }
        } else {
          console.warn('No question data received');
        }
      })
      .catch(error => {
        console.error('Error fetching question details:', error);
      });
  }, [lastQuestionId, checkAnsweredStatus, startTimer]);

  const pollGameStatus = useCallback((playerId) => {
    if (!playerId) return;
    
    setPollCount(prev => prev + 1);
    console.log(`Polling game status... (${pollCount})`);
    
    get(`/play/${playerId}/status`)
      .then(res => {
        console.log('Status response:', res);
        setLoading(false);
        
        if (res) {
          if (res.started === true) {
            console.log('Game has started (direct response)');
            fetchCurrentQuestion(playerId);
            return;
          }
          
          if (res.data) {
            if (res.data.status === 'ended' || res.data.finished) {
              setGameStatus('ended');
              clearAllIntervals();
              return;
            }
            
            if (res.data.status === 'active' || res.data.started === true) {
              console.log('Game has started (data response)');
              fetchCurrentQuestion(playerId);
              return;
            }
          }
          
          setGameStatus('waiting');
        }
      })
      .catch(error => {
        console.error('Error polling game status:', error);
        setLoading(false);
      });
  }, [pollCount, fetchCurrentQuestion, clearAllIntervals]);

  const startPolling = useCallback((playerId) => {
    pollGameStatus(playerId);
    
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    
    const interval = setInterval(() => {
      pollGameStatus(playerId);
    }, 2000);
    
    statusIntervalRef.current = interval;
  }, [pollGameStatus]);

  const joinGame = useCallback((sessionId, playerId, playerName) => {
    console.log(`Joining game with sessionId: ${sessionId}, playerId: ${playerId}, name: ${playerName}`);
    
    post(`/play/join/${sessionId}`, {
      playerId: playerId,
      name: playerName
    })
      .then(res => {
        console.log('Join game response:', res);
        
        if (res) {
          localStorage.setItem('playerId', playerId);
          localStorage.setItem('playerName', playerName);
          localStorage.setItem('sessionId', sessionId);
          
          setPlayerId(playerId);
          setPlayerName(playerName);
          setLoading(false);
          
          startPolling(playerId);
          message.success('Successfully joined game');
        } else {
          throw new Error('Invalid response from server');
        }
      })
      .catch(error => {
        console.error('Error joining game:', error);
        message.error('Failed to join game');
        navigate('/play');
      });
  }, [navigate, startPolling]);

  const sendAnswer = useCallback((answers) => {
    if (!playerId || !answers.length) return;
    
    console.log(`Sending answers: ${JSON.stringify(answers)}`);
    
    const payload = {
      answers: answers
    };
    console.log('Answer payload:', payload);
    
    put(`/play/${playerId}/answer`, payload)
      .then(res => {
        console.log('Answer submission response:', res);
        if (res) {
          const resultData = res.data || res;
          setAnswerResult(resultData);
          setGameStatus('answered');
        }
      })
      .catch(error => {
        console.error('Error submitting answer:', error);
        message.error('Failed to submit answer');
      });
  }, [playerId]);

  const handleAnswerSelect = useCallback((value, isMulti = false) => {
    console.log(`Selected answer: ${value}, isMulti: ${isMulti}`);
    
    let newAnswers;
    if (isMulti) {
      if (selectedAnswers.includes(value)) {
        newAnswers = selectedAnswers.filter(a => a !== value);
      } else {
        newAnswers = [...selectedAnswers, value];
      }
    } else {
      newAnswers = [value];
    }
    
    setSelectedAnswers(newAnswers);
    sendAnswer(newAnswers);
  }, [selectedAnswers, sendAnswer]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionParam = params.get('session');
    const storedSessionId = localStorage.getItem('sessionId');
    const storedPlayerId = localStorage.getItem('playerId');
    const storedPlayerName = localStorage.getItem('playerName');
    
    console.log('Session from URL:', sessionParam);
    console.log('Stored session:', storedSessionId);
    console.log('Stored player ID:', storedPlayerId);
    
    if (!sessionParam && !storedSessionId) {
      message.error('No session ID provided');
      navigate('/play');
      return;
    }
    
    const currentSessionId = sessionParam || storedSessionId;
    setSessionId(currentSessionId);
    
    if (!storedPlayerId) {
      const tempPlayerId = 'player_' + Math.random().toString(36).substring(2, 10);
      const tempPlayerName = 'Guest_' + Math.random().toString(36).substring(2, 6);
      
      joinGame(currentSessionId, tempPlayerId, tempPlayerName);
    } else {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName || 'Player');
      setLoading(false);
      
      startPolling(storedPlayerId);
    }
    
    return () => {
      clearAllIntervals();
    };
  }, [navigate, location.search, joinGame, startPolling, clearAllIntervals]);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7] && match[7].length === 11) ? match[7] : null;
  };

  const renderTimer = () => {
    const duration = currentQuestion?.duration || currentQuestion?.time || 30;
    const percent = Math.max(0, (timeRemaining / duration) * 100);
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 16,
        flexDirection: 'column'
      }}>
        <Progress 
          type="circle" 
          percent={percent} 
          format={() => timeRemaining} 
          strokeColor={percent > 50 ? '#52c41a' : percent > 20 ? '#faad14' : '#f5222d'}
          width={80}
        />
        <Text style={{ marginTop: 8 }}><ClockCircleOutlined /> Seconds Remaining</Text>
      </div>
    );
  };

  const renderMedia = () => {
    if (!currentQuestion || !currentQuestion.media) return null;   
    if (currentQuestion.media.type === 'image' && currentQuestion.media.url) {
      return (
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <Image 
            src={currentQuestion.media.url} 
            alt="Question Image" 
            style={{ maxHeight: 300, objectFit: 'contain' }}
          />
        </div>
      );
    } else if (currentQuestion.media.type === 'youtube' && currentQuestion.media.url) {
      const videoId = extractYouTubeId(currentQuestion.media.url);
      if (!videoId) return null;     
      return (
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <iframe 
            width="100%" 
            height="315" 
            src={`https://www.youtube.com/embed/${videoId}`} 
            title="YouTube video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      );
    }   
    return null;
  };

  const renderAnswerOptions = () => {
    if (!currentQuestion || !currentQuestion.options) return null;
 
    const type = currentQuestion.type || 'single';
    
    if (type === 'single') {
      return (
        <Radio.Group 
          value={selectedAnswers[0]} 
          onChange={(e) => handleAnswerSelect(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentQuestion.options.map((option, index) => (
              <Radio 
                key={index} 
                value={option}
                style={{ 
                  width: '100%', 
                  height: 50,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  marginRight: 0
                }}
              >
                {option}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      );
    } else if (type === 'multiple') {
      return (
        <Checkbox.Group 
          value={selectedAnswers} 
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentQuestion.options.map((option, index) => (
              <Checkbox 
                key={index} 
                value={option}
                onChange={(e) => handleAnswerSelect(option, true)}
                checked={selectedAnswers.includes(option)}
                style={{ 
                  width: '100%', 
                  height: 50,
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  marginRight: 0
                }}
              >
                {option}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      );
    } else if (type === 'judgement') {
      return (
        <Radio.Group 
          value={selectedAnswers[0]} 
          onChange={(e) => handleAnswerSelect(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio 
              value="True"
              style={{ 
                width: '100%', 
                height: 50,
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                marginRight: 0
              }}
            >
              True
            </Radio>
            <Radio 
              value="False"
              style={{ 
                width: '100%', 
                height: 50,
                padding: '12px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                marginRight: 0
              }}
            >
              False
            </Radio>
          </Space>
        </Radio.Group>
      );
    }
    
    return null;
  };

  const renderResult = () => {
    if (!answerResult) return null;
    
    return (
      <div style={{ textAlign: 'center' }}>
        {answerResult.correct ? (
          <Result
            status="success"
            title="Correct!"
            subTitle={`You earned ${answerResult.score || 10} points`}
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Result
            status="error"
            title="Incorrect"
            subTitle="Try to do better on the next question!"
            icon={<CloseCircleOutlined />}
          />
        )}
        
        {answerResult.correctAnswers && answerResult.correctAnswers.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Correct Answer{answerResult.correctAnswers.length > 1 ? 's' : ''}:</Text>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {answerResult.correctAnswers.map((answer, index) => (
                <li key={index} style={{ margin: '8px 0' }}>
                  <Text mark>{answer}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div style={{ marginTop: 24 }}>
          <Alert 
            message="Waiting for the next question..." 
            type="info" 
            showIcon 
            icon={<LoadingOutlined />}
          />
        </div>
      </div>
    );
  };

  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10, 
        background: 'rgba(0,0,0,0.6)', 
        color: 'white',
        padding: 10,
        borderRadius: 4,
        fontSize: 12,
        maxWidth: 300,
        zIndex: 1000
      }}>
        <div>Session ID: {sessionId}</div>
        <div>Player ID: {playerId}</div>
        <div>Status: {gameStatus}</div>
        <div>Poll count: {pollCount}</div>
        <div>Selected answers: {JSON.stringify(selectedAnswers)}</div>
        <div>Question ID: {lastQuestionId}</div>
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {renderDebugInfo()}
      
      <Header style={{ background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Quizora
        </Title>
        <Text style={{ color: 'white' }}>
          Playing as: {playerName}
        </Text>
      </Header>
      
      <Content style={{ padding: '50px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {loading ? (
            <Card bordered={false} style={{ textAlign: 'center', padding: 24 }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: 16 }}>Loading game...</Paragraph>
            </Card>
          ) : gameStatus === 'waiting' ? (
            <Card bordered={false} style={{ textAlign: 'center', padding: 24 }}>
              <Result
                title="Waiting for the game to start"
                subTitle="The host will start the game soon"
                icon={<LoadingOutlined style={{ fontSize: 72 }} />}
              />
            </Card>
          ) : gameStatus === 'ended' ? (
            <Card bordered={false} style={{ textAlign: 'center', padding: 24 }}>
              <Result
                status="info"
                title="Game has ended"
                subTitle="Thank you for playing!"
                extra={[
                  <Button type="primary" key="back" onClick={() => navigate('/play')}>
                    Back to Home
                  </Button>,
                ]}
              />
            </Card>
          ) : (gameStatus === 'results' || gameStatus === 'answered') ? (
            <Card bordered={false} style={{ padding: 24 }}>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                {currentQuestion?.content || 'Question'}
              </Title>
              {renderResult()}
            </Card>
          ) : currentQuestion ? (
            <Card bordered={false} style={{ padding: 24 }}>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                {currentQuestion.content}
              </Title>
              {renderMedia()}
              {renderTimer()}
              <div style={{ marginTop: 24 }}>
                {renderAnswerOptions()}
              </div>
            </Card>
          ) : (
            <Card bordered={false} style={{ textAlign: 'center', padding: 24 }}>
              <Result
                status="warning"
                title="Something went wrong"
                subTitle="Could not load the question"
                extra={[
                  <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
                    Refresh
                  </Button>,
                ]}
              />
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default PlayGame;