import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { getErrorMessage } from '../utils/format';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;

export function RegisterPage() {
  const { register } = useAuth();
  const [values, setValues] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const updateValue = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  useEffect(() => {
    if (!values.email || !values.email.includes('@')) {
      setEmailMessage('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const duplicated = await api.get(endpoints.users.checkEmail(values.email));
        setEmailMessage(duplicated ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.');
      } catch {
        setEmailMessage('');
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [values.email]);

  useEffect(() => {
    if (!values.nickname || values.nickname.length < 2) {
      setNicknameMessage('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const duplicated = await api.get(endpoints.users.checkNickname(values.nickname));
        setNicknameMessage(duplicated ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.');
      } catch {
        setNicknameMessage('');
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [values.nickname]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    if (values.password !== values.confirmPassword) {
      setStatus('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!passwordRegex.test(values.password)) {
      setStatus('비밀번호는 8~20자이며 대소문자, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: values.email,
        nickname: values.nickname,
        password: values.password,
        role: values.role,
        profileImage,
      });
      navigate('/login');
    } catch (error) {
      setStatus(getErrorMessage(error, '회원가입에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page narrow-page">
      <div className="page-title">
        <h1>종주메이트 시작하기</h1>
        <p>닉네임은 10자 이하, 비밀번호는 대소문자/숫자/특수문자를 포함해야 합니다.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        <FormField label="이메일" error={emailMessage}>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={updateValue}
            placeholder="example@email.com"
            required
          />
        </FormField>

        <FormField label="닉네임" error={nicknameMessage}>
          <input
            type="text"
            name="nickname"
            value={values.nickname}
            onChange={updateValue}
            maxLength={10}
            placeholder="닉네임"
            required
          />
        </FormField>

        <FormField label="비밀번호">
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={updateValue}
            placeholder="8~20자"
            required
          />
        </FormField>

        <FormField label="비밀번호 확인">
          <input
            type="password"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={updateValue}
            placeholder="다시 입력"
            required
          />
        </FormField>

        <FormField label="프로필 이미지">
          <input type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} />
        </FormField>

        <StatusMessage type="error">{status}</StatusMessage>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? '가입 중' : '가입하기'}
        </button>
      </form>

      <button className="text-button" type="button" onClick={() => navigate('/login')}>
        이미 계정이 있습니다
      </button>
    </section>
  );
}
