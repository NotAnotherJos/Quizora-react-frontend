
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Flex } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import {post} from '../../utils/request'

export default function Login(){
    const navigate = useNavigate();
    const onFinish = values => {
        console.log('Received values of form: ', values);
        const{ email, password} = values;
        const data = {
            email,
            password
        }
        post('/admin/auth/login',data)
            .then(res => {
                if(res && res.token){
                    localStorage.setItem('token',res.token);
                    localStorage.setItem('email',data.email);
                    navigate('/dashboard')
                }
            })
      };
      return (
        <Form
          name="login"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="Password" />
          </Form.Item>
    
          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Log in
            </Button>
            or <Link to='/register'>Register now!</Link>
          </Form.Item>
        </Form>
      );
}