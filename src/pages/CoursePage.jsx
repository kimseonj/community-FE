import { useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, MapPinned, SendHorizontal, ShieldCheck, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { courseStatusLabels, formatDate, getErrorMessage } from '../utils/format';

const reportTypes = [
  { value: 'NORMAL', label: '정상' },
  { value: 'CAUTION', label: '주의' },
  { value: 'CONSTRUCTION', label: '공사' },
  { value: 'CLOSED', label: '통제' },
];

export function CoursePage() {
  const { isLoggedIn } = useAuth();
  const [courses, setCourses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [reportType, setReportType] = useState('CAUTION');
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const subscribedIds = useMemo(() => new Set(subscriptions.map((course) => course.id)), [subscriptions]);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const courseSummary = useMemo(() => {
    const cautionCount = courses.filter((course) => course.currentStatus && course.currentStatus !== 'NORMAL').length;

    return [
      { label: '전체 코스', value: courses.length, icon: MapPinned },
      { label: '정상 주행', value: courses.length - cautionCount, icon: ShieldCheck },
      { label: '주의 필요', value: cautionCount, icon: TriangleAlert },
      { label: '내 알림', value: subscriptions.length, icon: Bell },
    ];
  }, [courses, subscriptions.length]);

  const loadCourses = async () => {
    setLoading(true);
    setStatus('');

    try {
      const courseList = await api.get(endpoints.courses.list);
      setCourses(courseList || []);
      setSelectedCourseId((prev) => prev || courseList?.[0]?.id || null);

      if (isLoggedIn) {
        const subscriptionList = await api.get(endpoints.courses.subscriptions).catch(() => []);
        setSubscriptions(subscriptionList || []);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      setStatus(getErrorMessage(error, '코스 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const toggleSubscription = async (course) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      if (subscribedIds.has(course.id)) {
        await api.delete(endpoints.courses.subscribe(course.id));
        setSubscriptions((prev) => prev.filter((item) => item.id !== course.id));
      } else {
        await api.post(endpoints.courses.subscribe(course.id));
        setSubscriptions((prev) => [...prev, course]);
      }
    } catch (error) {
      setStatus(getErrorMessage(error, '알림받기 변경에 실패했습니다.'));
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!selectedCourse?.id || !reportContent.trim()) return;

    try {
      await api.post(endpoints.courses.report(selectedCourse.id), {
        type: reportType,
        content: reportContent.trim(),
      });
      setReportContent('');
      await loadCourses();
      setStatus('제보가 등록되었습니다.');
    } catch (error) {
      setStatus(getErrorMessage(error, '제보 등록에 실패했습니다.'));
    }
  };

  return (
    <section className="page">
      <div className="page-title">
        <h1>코스 상태</h1>
        <p>국토종주 코스 상태를 확인하고 알림받기를 등록합니다.</p>
      </div>

      <StatusMessage type={status === '제보가 등록되었습니다.' ? 'success' : 'error'}>{status}</StatusMessage>

      {loading ? (
        <div className="list-skeleton" aria-label="코스 로딩 중">
          <span />
          <span />
          <span />
        </div>
      ) : status && courses.length === 0 ? (
        <EmptyState title="코스를 표시할 수 없습니다" description="백엔드 연결 또는 API 응답을 확인해주세요." />
      ) : courses.length === 0 ? (
        <EmptyState title="등록된 코스가 없습니다" />
      ) : (
        <>
          <div className="course-dashboard" aria-label="코스 상태 요약">
            {courseSummary.map((item) => {
              const Icon = item.icon;

              return (
                <div className="course-dashboard-item" key={item.label}>
                  <Icon size={18} aria-hidden="true" />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="course-list">
            {courses.map((course) => {
              const subscribed = subscribedIds.has(course.id);

              return (
                <article
                  key={course.id}
                  className={`course-card ${selectedCourse?.id === course.id ? 'selected' : ''}`}
                >
                  <button className="course-main-button" type="button" onClick={() => setSelectedCourseId(course.id)}>
                    <span className={`status-chip ${course.currentStatus}`}>{courseStatusLabels[course.currentStatus] || course.currentStatus}</span>
                    <h2>{course.name}</h2>
                    <p>최근 업데이트 {formatDate(course.updatedAt || course.createdAt) || '정보 없음'}</p>
                  </button>
                  <button
                    type="button"
                    className={subscribed ? 'subscribed-button' : 'secondary-button compact'}
                    onClick={() => toggleSubscription(course)}
                  >
                    {subscribed ? <BellOff size={16} aria-hidden="true" /> : <Bell size={16} aria-hidden="true" />}
                    {subscribed ? '해제' : '알림'}
                  </button>
                </article>
              );
            })}
          </div>

          <form className="form-panel report-panel" onSubmit={submitReport}>
            <div className="panel-heading">
              <h2>{selectedCourse?.name || '코스'} 제보</h2>
              <p>제보 등록 시 이 코스를 구독한 사용자에게 알림이 생성됩니다.</p>
            </div>

            <FormField label="제보 타입">
              <div className="pill-radio-group">
                {reportTypes.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={reportType === type.value ? 'active' : ''}
                    onClick={() => setReportType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="내용">
              <textarea
                value={reportContent}
                onChange={(event) => setReportContent(event.target.value)}
                maxLength={1000}
                placeholder={isLoggedIn ? '상태를 구체적으로 적어주세요' : '로그인 후 제보할 수 있습니다'}
                disabled={!isLoggedIn}
              />
            </FormField>

            <button className="primary-button" type="submit" disabled={!isLoggedIn || !reportContent.trim()}>
              <SendHorizontal size={18} aria-hidden="true" />
              제보 등록
            </button>
          </form>
        </>
      )}
    </section>
  );
}
