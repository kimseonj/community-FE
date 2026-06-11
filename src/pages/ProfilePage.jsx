import { useEffect, useState } from 'react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { getErrorMessage } from '../utils/format';

export function ProfilePage() {
  const { user, isLoggedIn, authChecked, updateProfile, logout } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (authChecked && !isLoggedIn) {
      navigate('/login');
    }
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    setNickname(user?.nickname || '');
  }, [user?.nickname]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setSaving(true);

    try {
      await updateProfile({ nickname: nickname.trim(), profileImage });
      setProfileImage(null);
      setStatus('프로필이 저장되었습니다.');
    } catch (error) {
      setStatus(getErrorMessage(error, '프로필 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordStatus('');
    setChangingPassword(true);

    try {
      await api.patch(endpoints.users.updatePassword, passwords);
      await logout();
      navigate('/login');
    } catch (error) {
      setPasswordStatus(getErrorMessage(error, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="page narrow-page">
      <div className="page-title">
        <h1>내 정보</h1>
        <p>프로필과 계정 보안 정보를 관리합니다.</p>
      </div>

      <div className="profile-summary">
        <div className="profile-image">
          {user.imageUrl ? <img src={resolveAssetUrl(user.imageUrl)} alt="" /> : <UserRound size={28} aria-hidden="true" />}
        </div>
        <div>
          <strong>{user.nickname}</strong>
          <span>{user.email}</span>
        </div>
      </div>

      <form className="form-panel" onSubmit={handleProfileSubmit}>
        <div className="panel-heading">
          <h2>프로필 수정</h2>
        </div>

        <FormField label="닉네임">
          <input value={nickname} maxLength={10} onChange={(event) => setNickname(event.target.value)} required />
        </FormField>

        <FormField label="프로필 이미지">
          <input type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} />
        </FormField>

        <StatusMessage type={status === '프로필이 저장되었습니다.' ? 'success' : 'error'}>{status}</StatusMessage>

        <button className="primary-button" type="submit" disabled={saving}>
          <Save size={18} aria-hidden="true" />
          {saving ? '저장 중' : '저장'}
        </button>
      </form>

      <form className="form-panel" onSubmit={handlePasswordSubmit}>
        <div className="panel-heading">
          <h2>비밀번호 변경</h2>
          <p>변경 후 다시 로그인해야 합니다.</p>
        </div>

        <FormField label="현재 비밀번호">
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))}
            required
          />
        </FormField>

        <FormField label="새 비밀번호">
          <input
            type="password"
            value={passwords.newPassword}
            onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
            placeholder="대소문자, 숫자, 특수문자 포함"
            required
          />
        </FormField>

        <StatusMessage type="error">{passwordStatus}</StatusMessage>

        <button className="secondary-button" type="submit" disabled={changingPassword}>
          <KeyRound size={18} aria-hidden="true" />
          {changingPassword ? '변경 중' : '비밀번호 변경'}
        </button>
      </form>
    </section>
  );
}
