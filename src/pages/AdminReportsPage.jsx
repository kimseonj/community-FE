import { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../hooks/useHashRoute';
import { courseStatusLabels, formatDate, getErrorMessage } from '../utils/format';

const filters = [
  { value: 'PENDING', label: '승인 대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
];

function normalizeReports(data) {
  if (Array.isArray(data)) return { reports: data, nextCursor: null, hasNext: false };
  return {
    reports: data?.reports || data?.content || [],
    nextCursor: data?.nextCursor || null,
    hasNext: Boolean(data?.hasNext),
  };
}

export function AdminReportsPage() {
  const { user, isLoggedIn, authChecked } = useAuth();
  const [filter, setFilter] = useState('PENDING');
  const [reports, setReports] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState({ type: 'error', text: '' });

  const loadReports = useCallback(async ({ append = false, cursor } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    if (!append) setReports([]);
    setMessage({ type: 'error', text: '' });

    try {
      const data = normalizeReports(await api.get(endpoints.admin.reports.list({ status: filter, cursor })));
      setReports((prev) => (append ? [...prev, ...data.reports] : data.reports));
      setNextCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, '제보 목록을 불러오지 못했습니다.') });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!authChecked) return;
    if (!isLoggedIn) navigate('/login');
    else if (user?.role !== 'ADMIN') navigate('/home');
  }, [authChecked, isLoggedIn, user?.role]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadReports();
  }, [loadReports, user?.role]);

  const updateReport = async (reportId, payload, successMessage) => {
    try {
      await api.patch(endpoints.admin.reports.update(reportId), payload);
      setEditing(null);
      await loadReports();
      setMessage({ type: 'success', text: successMessage });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, '제보 처리에 실패했습니다.') });
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('이 제보를 삭제할까요?')) return;

    try {
      await api.delete(endpoints.admin.reports.delete(reportId));
      await loadReports();
      setMessage({ type: 'success', text: '제보를 삭제했습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, '제보 삭제에 실패했습니다.') });
    }
  };

  if (!authChecked || user?.role !== 'ADMIN') return null;

  return (
    <section className="page admin-reports-page">
      <div className="page-title">
        <h1>제보 관리</h1>
        <p>코스 상태 제보를 검토하고 승인, 수정, 반려 또는 삭제합니다.</p>
      </div>

      <div className="segmented-control" aria-label="제보 상태 필터">
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            className={filter === item.value ? 'active' : ''}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <StatusMessage type={message.type}>{message.text}</StatusMessage>

      {loading ? (
        <div className="list-skeleton" aria-label="제보 목록 로딩 중">
          <span />
          <span />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title={message.text ? '제보를 표시할 수 없습니다' : '해당 상태의 제보가 없습니다'}
          description={message.text ? '관리자 제보 API가 연결되어 있는지 확인해주세요.' : undefined}
        />
      ) : (
        <div className="admin-report-list">
          {reports.map((report) => (
            <article className="admin-report-card" key={report.id}>
              <div className="admin-report-heading">
                <div>
                  <span className={`status-chip ${report.type}`}>
                    {courseStatusLabels[report.type] || report.type}
                  </span>
                  <h2>{report.courseName || `코스 #${report.courseId}`}</h2>
                </div>
                <span>{formatDate(report.createdAt)}</span>
              </div>

              {editing?.id === report.id ? (
                <form
                  className="admin-report-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateReport(report.id, { type: editing.type, content: editing.content }, '제보를 수정했습니다.');
                  }}
                >
                  <FormField label="상태 타입">
                    <select
                      value={editing.type}
                      onChange={(event) => setEditing((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      {Object.entries(courseStatusLabels).map(([value, label]) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="제보 내용">
                    <textarea
                      value={editing.content}
                      maxLength={1000}
                      required
                      onChange={(event) => setEditing((prev) => ({ ...prev, content: event.target.value }))}
                    />
                  </FormField>
                  <div className="admin-report-actions">
                    <button className="primary-button compact" type="submit">저장</button>
                    <button className="secondary-button compact" type="button" onClick={() => setEditing(null)}>취소</button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{report.content}</p>
                  <span className="admin-report-author">제보자 {report.reporterNickname || '알 수 없음'}</span>
                  <div className="admin-report-actions">
                    {report.status === 'PENDING' && (
                      <>
                        <button
                          className="primary-button compact"
                          type="button"
                          onClick={() => updateReport(report.id, { status: 'APPROVED' }, '제보를 승인했습니다.')}
                        >
                          <Check size={16} aria-hidden="true" /> 승인
                        </button>
                        <button
                          className="secondary-button compact"
                          type="button"
                          onClick={() => updateReport(report.id, { status: 'REJECTED' }, '제보를 반려했습니다.')}
                        >
                          <X size={16} aria-hidden="true" /> 반려
                        </button>
                      </>
                    )}
                    <button
                      className="secondary-button compact"
                      type="button"
                      onClick={() => setEditing({ id: report.id, type: report.type, content: report.content })}
                    >
                      <Pencil size={16} aria-hidden="true" /> 수정
                    </button>
                    <button className="danger-button compact" type="button" onClick={() => deleteReport(report.id)}>
                      <Trash2 size={16} aria-hidden="true" /> 삭제
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {hasNext && (
        <button
          className="secondary-button"
          type="button"
          disabled={loadingMore}
          onClick={() => loadReports({ append: true, cursor: nextCursor })}
        >
          {loadingMore ? '불러오는 중' : '더 보기'}
        </button>
      )}
    </section>
  );
}
