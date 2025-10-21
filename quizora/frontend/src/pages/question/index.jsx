import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, put } from '../../utils/request';
import {
  Typography, Layout, Button, Form, Input, Select, InputNumber,
  Card, Space, message, Spin, Radio, Checkbox, Divider
} from 'antd';
import { 
  ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined, 
  UploadOutlined, VideoCameraOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

export default function QuestionEditPage() {
  const { game_id, question_id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionType, setQuestionType] = useState('single');
  const [options, setOptions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [allGames, setAllGames] = useState([]);

  useEffect(() => {
    loadQuestionData();
  }, [game_id, question_id]);

  const loadQuestionData = () => {
    setLoading(true);
    get('/admin/games')
      .then(response => {
        const games = response.games || [];
        setAllGames(games);
        
        const currentGame = games.find(g => g.id === parseInt(game_id));
        if (!currentGame) {
          message.error('Game not found');
          setLoading(false);
          return;
        }
        
        setGame(currentGame);
        
        // Handle new question case
        if (question_id === 'new') {
          const newQuestion = {
            id: Date.now(),
            content: '',
            type: 'single',
            duration: 30,
            points: 10,
            options: ['', ''],
            correctAnswers: [],
            media: { type: 'none', url: '' }
          };
          setQuestion(newQuestion);
          setQuestionType('single');
          setOptions([
            { id: 1, text: '' },
            { id: 2, text: '' }
          ]);
          initFormWithQuestion(newQuestion);
          setLoading(false);
          return;
        }
        
        // Find existing question
        const qIndex = currentGame.questions?.findIndex(q => 
          q.id?.toString() === question_id.toString());
        
        if (qIndex === -1 || qIndex === undefined) {
          message.error('Question not found');
          setLoading(false);
          return;
        }
        
        const currentQuestion = currentGame.questions[qIndex];
        setQuestionIndex(qIndex);
        setQuestion(currentQuestion);
        
        // Set question type
        const type = currentQuestion.type || 'single';
        setQuestionType(type);
        
        // Set options
        if (type === 'judgement') {
          setOptions([
            { id: 1, text: 'True' },
            { id: 2, text: 'False' }
          ]);
        } else {
          // For single and multiple choice questions
          const questionOptions = currentQuestion.options || ['', ''];
          setOptions(questionOptions.map((opt, index) => ({
            id: index + 1,
            text: opt
          })));
        }
        
        // Initialize form with question data
        initFormWithQuestion(currentQuestion);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load question data:', error);
        message.error('Failed to load question data');
        setLoading(false);
      });
  };

  // Initialize form with question data
  const initFormWithQuestion = (q) => {
    // Prepare correct answers for form
    let correctAnswerValues = {};
    
    if (q.type === 'single') {
      if (q.correctAnswers && q.correctAnswers.length > 0) {
        const correctOption = q.options?.findIndex(opt => 
          q.correctAnswers.includes(opt));
        correctAnswerValues.singleCorrectAnswer = correctOption !== -1 ? correctOption + 1 : null;
      }
    } else if (q.type === 'multiple') {
      if (q.correctAnswers && q.correctAnswers.length > 0) {
        const correctIndices = q.correctAnswers.map(ans => {
          const index = q.options?.findIndex(opt => opt === ans);
          return index !== -1 ? index + 1 : null;
        }).filter(idx => idx !== null);
        correctAnswerValues.multipleCorrectAnswers = correctIndices;
      }
    } else if (q.type === 'judgement') {
      if (q.correctAnswers && q.correctAnswers.length > 0) {
        correctAnswerValues.judgementAnswer = 
          q.correctAnswers[0] === 'True' ? 'true' : 'false';
      }
    }
    
    // Set form values
    form.setFieldsValue({
      content: q.content || '',
      type: q.type || 'single',
      duration: q.duration || 30,
      points: q.points || 10,
      mediaType: q.media?.type || 'none',
      mediaUrl: q.media?.url || '',
      ...correctAnswerValues
    });
  };

  // Handle question type change
  const handleTypeChange = (value) => {
    setQuestionType(value);
    
    // Reset options based on type
    if (value === 'judgement') {
      setOptions([
        { id: 1, text: 'True' },
        { id: 2, text: 'False' }
      ]);
      form.setFieldsValue({ judgementAnswer: null });
    } else if (value === 'single' || value === 'multiple') {
      // Maintain existing options if switching between single and multiple
      if (options.length < 2 || (questionType === 'judgement')) {
        setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
      }
      
      if (value === 'single') {
        form.setFieldsValue({ singleCorrectAnswer: null });
      } else {
        form.setFieldsValue({ multipleCorrectAnswers: [] });
      }
    }
  };

  // Option management
  const addOption = () => {
    if (options.length >= 6) {
      message.warning('Maximum 6 options allowed');
      return;
    }
    
    const newOptionId = options.length > 0 
      ? Math.max(...options.map(o => o.id)) + 1 
      : 1;
    setOptions([...options, { id: newOptionId, text: '' }]);
  };

  const removeOption = (id) => {
    if (options.length <= 2) {
      message.warning('At least two options are required');
      return;
    }
    
    setOptions(options.filter(o => o.id !== id));
    
    // Update correct answers if needed
    if (questionType === 'single') {
      const currentValue = form.getFieldValue('singleCorrectAnswer');
      if (currentValue === id) {
        form.setFieldsValue({ singleCorrectAnswer: null });
      }
    } else if (questionType === 'multiple') {
      const currentValues = form.getFieldValue('multipleCorrectAnswers') || [];
      if (currentValues.includes(id)) {
        form.setFieldsValue({ 
          multipleCorrectAnswers: currentValues.filter(v => v !== id) 
        });
      }
    }
  };

  const handleOptionChange = (id, value) => {
    setOptions(options.map(o => o.id === id ? { ...o, text: value } : o));
  };

  // Handle form submission
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        setSaving(true);
        
        // Prepare updated question object
        let correctAnswers = [];
        let questionOptions = [];
        
        if (questionType === 'judgement') {
          questionOptions = ['True', 'False'];
          correctAnswers = [values.judgementAnswer === 'true' ? 'True' : 'False'];
        } else {
          questionOptions = options.map(o => o.text.trim()).filter(t => t !== '');
          
          if (questionType === 'single') {
            const selectedOption = options.find(o => o.id === values.singleCorrectAnswer);
            correctAnswers = selectedOption ? [selectedOption.text.trim()] : [];
          } else if (questionType === 'multiple') {
            correctAnswers = (values.multipleCorrectAnswers || []).map(id => {
              const option = options.find(o => o.id === id);
              return option ? option.text.trim() : null;
            }).filter(t => t !== null);
          }
        }
        
        // Validate options and correct answers
        if (questionOptions.length < 2) {
          message.error('At least two options are required');
          setSaving(false);
          return;
        }
        
        if (correctAnswers.length === 0) {
          message.error('Please select at least one correct answer');
          setSaving(false);
          return;
        }
        
        // Update question object
        const updatedQuestion = {
          ...question,
          content: values.content,
          type: values.type,
          duration: values.duration,
          points: values.points,
          options: questionOptions,
          correctAnswers: correctAnswers,
          media: {
            type: values.mediaType,
            url: values.mediaUrl
          }
        };
        
        // Create updated games array
        const updatedGames = [...allGames];
        const gameIndex = updatedGames.findIndex(g => g.id === parseInt(game_id));
        
        if (gameIndex === -1) {
          message.error('Game not found');
          setSaving(false);
          return;
        }
        
        // Handle new question vs update existing
        if (question_id === 'new') {
          // Add new question to the game
          if (!updatedGames[gameIndex].questions) {
            updatedGames[gameIndex].questions = [];
          }
          updatedGames[gameIndex].questions.push(updatedQuestion);
        } else {
          // Update existing question
          if (questionIndex === -1) {
            message.error('Question not found');
            setSaving(false);
            return;
          }
          updatedGames[gameIndex].questions[questionIndex] = updatedQuestion;
        }
        
        // Save to server
        put('/admin/games', { games: updatedGames })
          .then(() => {
            message.success('Question saved successfully');
            setSaving(false);
            navigate(`/game/${game_id}`);
          })
          .catch(err => {
            console.error('Failed to save question:', err);
            message.error('Failed to save question');
            setSaving(false);
          });
      })
      .catch(error => {
        console.error('Validation failed:', error);
      });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            type="text" 
            style={{ color: 'white', marginRight: 16 }}
            onClick={() => navigate(`/game/${game_id}`)}
          />
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            {question_id === 'new' ? 'Create New Question' : 'Edit Question'}
          </Title>
        </div>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Save Question
          </Button>
        </Space>
      </Header>
      
      <Content style={{ padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="Loading question..." />
          </div>
        ) : (
          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                type: 'single',
                duration: 30,
                points: 10,
                mediaType: 'none'
              }}
            >
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 60%', minWidth: 300 }}>
                  <Form.Item
                    name="content"
                    label="Question Content"
                    rules={[{ required: true, message: 'Please input the question content!' }]}
                  >
                    <Input.TextArea rows={4} placeholder="Enter your question here" />
                  </Form.Item>
                </div>
                
                <div style={{ flex: '1 1 30%', minWidth: 250 }}>
                  <Form.Item
                    name="type"
                    label="Question Type"
                    rules={[{ required: true }]}
                  >
                    <Select onChange={handleTypeChange}>
                      <Option value="single">Single Choice</Option>
                      <Option value="multiple">Multiple Choice</Option>
                      <Option value="judgement">True/False</Option>
                    </Select>
                  </Form.Item>
                  
                  <Space style={{ width: '100%' }} direction="horizontal">
                    <Form.Item
                      name="duration"
                      label="Time Limit (seconds)"
                      rules={[{ required: true }]}
                      style={{ marginRight: 16, width: '50%' }}
                    >
                      <InputNumber min={5} max={300} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="points"
                      label="Points"
                      rules={[{ required: true }]}
                      style={{ width: '50%' }}
                    >
                      <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Space>
                </div>
              </div>
              
              <Divider>Media (Optional)</Divider>
              
              <Form.Item name="mediaType" label="Media Type">
                <Select>
                  <Option value="none">None</Option>
                  <Option value="image">Image URL</Option>
                  <Option value="youtube">YouTube Video</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.mediaType !== currentValues.mediaType
                }
              >
                {({ getFieldValue }) => {
                  const mediaType = getFieldValue('mediaType');
                  return mediaType !== 'none' ? (
                    <Form.Item 
                      name="mediaUrl" 
                      label={mediaType === 'image' ? 'Image URL' : 'YouTube Video URL'}
                      rules={[{ 
                        required: mediaType !== 'none', 
                        message: `Please input the ${mediaType === 'image' ? 'image' : 'video'} URL!` 
                      }]}
                    >
                      <Input 
                        placeholder={mediaType === 'image' 
                          ? 'https://example.com/image.jpg' 
                          : 'https://www.youtube.com/watch?v=xxxx'
                        }
                        prefix={mediaType === 'image' 
                          ? <UploadOutlined /> 
                          : <VideoCameraOutlined />
                        }
                      />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>
              
              <Divider>Answer Options</Divider>
              
              {/* Options for True/False questions */}
              {questionType === 'judgement' ? (
                <Form.Item
                  name="judgementAnswer"
                  label="Correct Answer"
                  rules={[{ required: true, message: 'Please select the correct answer!' }]}
                >
                  <Radio.Group>
                    <Radio value="true">True</Radio>
                    <Radio value="false">False</Radio>
                  </Radio.Group>
                </Form.Item>
              ) : (
                /* Options for Single Choice questions */
                questionType === 'single' ? (
                  <>
                    <Form.Item
                      name="singleCorrectAnswer"
                      label="Options (select the correct answer)"
                      rules={[{ required: true, message: 'Please select the correct answer!' }]}
                    >
                      <Radio.Group>
                        {options.map((option, index) => (
                          <div 
                            key={option.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              marginBottom: 12,
                              gap: 12 
                            }}
                          >
                            <Radio value={option.id} />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => handleOptionChange(option.id, e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <Button 
                              type="text" 
                              danger 
                              icon={<MinusCircleOutlined />} 
                              onClick={() => removeOption(option.id)}
                              disabled={options.length <= 2}
                            />
                          </div>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                    
                    <Button
                      type="dashed"
                      onClick={addOption}
                      block
                      icon={<PlusOutlined />}
                      disabled={options.length >= 6}
                      style={{ marginBottom: 16 }}
                    >
                      Add Option {options.length >= 6 && "(Maximum 6)"}
                    </Button>
                  </>
                ) : (
                  /* Options for Multiple Choice questions */
                  <>
                    <Form.Item
                      name="multipleCorrectAnswers"
                      label="Options (select all correct answers)"
                      rules={[{ 
                        required: true, 
                        message: 'Please select at least one correct answer!',
                        type: 'array',
                        min: 1 
                      }]}
                    >
                      <Checkbox.Group>
                        {options.map((option, index) => (
                          <div 
                            key={option.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              marginBottom: 12,
                              gap: 12 
                            }}
                          >
                            <Checkbox value={option.id} />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => handleOptionChange(option.id, e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <Button 
                              type="text" 
                              danger 
                              icon={<MinusCircleOutlined />} 
                              onClick={() => removeOption(option.id)}
                              disabled={options.length <= 2}
                            />
                          </div>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                    
                    <Button
                      type="dashed"
                      onClick={addOption}
                      block
                      icon={<PlusOutlined />}
                      disabled={options.length >= 6}
                      style={{ marginBottom: 16 }}
                    >
                      Add Option {options.length >= 6 && "(Maximum 6)"}
                    </Button>
                  </>
                )
              )}
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button type="primary" size="large" onClick={handleSubmit} loading={saving}>
                    Save Question
                  </Button>
                  <Button size="large" onClick={() => navigate(`/game/${game_id}`)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Content>
    </Layout>
  );
}