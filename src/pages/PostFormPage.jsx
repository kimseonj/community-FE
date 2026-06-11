import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, Save } from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { getErrorMessage, postTypeLabels, toFormData } from '../utils/format';

const MAX_IMAGES = 5;

export function PostFormPage({ postId }) {
  const editing = Boolean(postId);
  const { isLoggedIn, authChecked } = useAuth();
  const [values, setValues] = useState({ title: '', type: 'IN_PROGRESS', content: '' });
  const [existingImages, setExistingImages] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const previews = useMemo(
    () => newImages.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [newImages],
  );

  useEffect(() => {
    return () => previews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [previews]);

  useEffect(() => {
    if (authChecked && !isLoggedIn) {
      navigate('/login');
    }
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    if (!editing) return;

    const loadPost = async () => {
      setLoading(true);
      setStatus('');

      try {
        const data = await api.get(endpoints.posts.detail(postId));
        setValues({
          title: data.title || '',
          type: data.postType || 'IN_PROGRESS',
          content: data.content || '',
        });
        setExistingImages(data.images || []);
      } catch (error) {
        setStatus(getErrorMessage(error, '수정할 게시글을 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [editing, postId]);

  const updateValue = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    const remainingSlots = MAX_IMAGES - (existingImages.length - removeImageIds.length) - newImages.length;
    setNewImages((prev) => [...prev, ...files.slice(0, Math.max(remainingSlots, 0))]);
    event.target.value = '';
  };

  const toggleRemoveImage = (imageId) => {
    setRemoveImageIds((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    if (values.title.length > 26) {
      setStatus('제목은 26자 이하로 입력해주세요.');
      return;
    }

    if (!values.content.trim()) {
      setStatus('내용을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const formData = toFormData(
        {
          title: values.title.trim(),
          type: values.type,
          content: values.content.trim(),
          removeImageIds: editing ? removeImageIds : [],
        },
        { postImages: newImages },
      );

      const nextPostId = editing
        ? await api.patch(endpoints.posts.update(postId), formData)
        : await api.post(endpoints.posts.create, formData);

      navigate(`/posts/${editing ? postId : nextPostId}`);
    } catch (error) {
      setStatus(getErrorMessage(error, editing ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="list-skeleton" aria-label="작성 화면 로딩 중">
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section className="page narrow-page">
      <button className="back-button" type="button" onClick={() => (editing ? navigate(`/posts/${postId}`) : navigate('/feed'))}>
        <ArrowLeft size={18} aria-hidden="true" />
        돌아가기
      </button>

      <div className="page-title">
        <h1>{editing ? '기록 수정' : '기록 작성'}</h1>
        <p>기능 우선으로 제목, 상태, 내용, 이미지만 입력합니다.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        <FormField label="상태">
          <div className="pill-radio-group">
            {Object.entries(postTypeLabels).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={values.type === value ? 'active' : ''}
                onClick={() => setValues((prev) => ({ ...prev, type: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label={`제목 ${values.title.length}/26`}>
          <input name="title" value={values.title} maxLength={26} onChange={updateValue} placeholder="제목" required />
        </FormField>

        <FormField label="내용">
          <textarea
            name="content"
            value={values.content}
            maxLength={1000}
            onChange={updateValue}
            placeholder="종주 기록을 입력하세요"
            required
          />
        </FormField>

        {existingImages.length > 0 && (
          <div className="existing-images">
            <strong>기존 이미지</strong>
            <div className="image-grid">
              {existingImages.map((image) => (
                <button
                  type="button"
                  key={image.imageId}
                  className={removeImageIds.includes(image.imageId) ? 'marked-remove' : ''}
                  onClick={() => toggleRemoveImage(image.imageId)}
                >
                  <img src={resolveAssetUrl(image.imageUrl)} alt="" />
                  <span>{removeImageIds.includes(image.imageId) ? '제거 예정' : '유지'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <FormField label="새 이미지">
          <div className="file-drop">
            <ImagePlus size={20} aria-hidden="true" />
            <input type="file" accept="image/*" multiple onChange={handleImages} />
          </div>
        </FormField>

        {previews.length > 0 && (
          <div className="image-grid">
            {previews.map((image, index) => (
              <button
                type="button"
                key={`${image.name}-${image.url}`}
                onClick={() => setNewImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
              >
                <img src={image.url} alt="" />
                <span>제거</span>
              </button>
            ))}
          </div>
        )}

        <StatusMessage type="error">{status}</StatusMessage>

        <button className="primary-button" type="submit" disabled={saving}>
          <Save size={18} aria-hidden="true" />
          {saving ? '저장 중' : '저장'}
        </button>
      </form>
    </section>
  );
}
