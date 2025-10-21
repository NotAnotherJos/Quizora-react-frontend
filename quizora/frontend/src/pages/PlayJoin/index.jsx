// src/pages/PlayJoin/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { post } from '../../utils/request';
import {
  Layout, Typography, Card, Form, Input, Button, message, Space, Divider
} from 'antd';
import { UserOutlined, NumberOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function PlayJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [joining, setJoining] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [form] = Form.useForm();

  // 从URL参数中提取会话ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionParam = params.get('session');
    if (sessionParam) {
      setSessionId(sessionParam);
      form.setFieldsValue({ sessionId: sessionParam });
    }
  }, [location, form]);

  // 处理加入游戏
  const handleJoin = (values) => {
    const currentSessionId = values.sessionId || sessionId;
    const playerName = values.playerName;

    if (!currentSessionId) {
      message.error('Please enter a session ID');
      return;
    }

    setJoining(true);
    post(`/play/join/${currentSessionId}`, {
      name: playerName
    })
      .then(res => {
        if (res && res.playerId) {
          message.success('Successfully joined the game!');
          
          // 保存玩家ID和会话ID以便在游戏中使用
          localStorage.setItem('playerId', res.playerId);
          localStorage.setItem('sessionId', currentSessionId);
          localStorage.setItem('playerName', playerName);
          
          // 导航到游戏页面
          navigate(`/play/game?session=${currentSessionId}`);
        } else {
          message.error('Failed to join the game');
          setJoining(false);
        }
      })
      .catch(error => {
        console.error('Join game error:', error);
        message.error('Error joining the game. The session may be invalid or has ended.');
        setJoining(false);
      });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          Quizora - Join Game
        </Title>
      </Header>
      
      <Content style={{ padding: '50px 0' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Card 
            bordered={false} 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3}>Join a Quizora Game</Title>
              <Paragraph type="secondary">
                Enter your name and the session ID to join the game
              </Paragraph>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{ sessionId }}
              onFinish={handleJoin}
            >
              <Form.Item
                name="sessionId"
                label="Session ID"
                rules={[{ required: true, message: 'Please enter the session ID' }]}
              >
                <Input 
                  prefix={<NumberOutlined />} 
                  placeholder="Enter the session ID provided by the administrator"
                  size="large"
                />
              </Form.Item>
              
              <Form.Item
                name="playerName"
                label="Your Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter your name"
                  size="large"
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block
                  loading={joining}
                  icon={<ArrowRightOutlined />}
                >
                  Join Game
                </Button>
              </Form.Item>
            </Form>
            
            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                Have a direct link? Simply follow the URL provided by the administrator.
              </Text>
            </div>
          </Card>
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button type="link" onClick={() => navigate('/')}>Return to Home</Button>
              <Button type="link" onClick={() => navigate('/dashboard')}>Admin Dashboard</Button>
            </Space>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default PlayJoin;