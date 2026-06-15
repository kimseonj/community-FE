import { useState } from 'react';
import { Mail, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { getErrorMessage } from '../utils/format';

export function LoginPage() {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const updateValue = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      await login(values);
      navigate('/feed');
    } catch (error) {
      setStatus(getErrorMessage(error, '이메일 또는 비밀번호를 확인해주세요.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page narrow-page">
      <div className="page-title">
        <h1>종주메이트 로그인</h1>
        <p>기록 작성, 좋아요, 코스 알림받기는 로그인이 필요합니다.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        <FormField label="이메일">
          <div className="input-with-icon">
            <Mail size={18} aria-hidden="true" />
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={updateValue}
              placeholder="example@email.com"
              required
            />
          </div>
        </FormField>

        <FormField label="비밀번호">
          <div className="input-with-icon">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={updateValue}
              placeholder="비밀번호"
              required
            />
          </div>
        </FormField>

        <StatusMessage type="error">{status}</StatusMessage>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? '로그인 중' : '로그인'}
        </button>
      </form>

      <button className="text-button" type="button" onClick={() => navigate('/register')}>
        계정 만들기
      </button>
    </section>
  );
}
