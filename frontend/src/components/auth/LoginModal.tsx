import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import {
  Loader2, Lock, User, ArrowLeft, Eye, EyeOff,
  Store, ShieldCheck, TrendingUp, QrCode, Headphones,
  LayoutDashboard, Users, BarChart3,
} from 'lucide-react';

type LoginTab = 'owner' | 'admin';

const TAB_CONTENT = {
  owner: {
    badge: 'Kênh Đối Tác',
    title: (
      <>
        Đưa quán của bạn
        <br />
        lên bản đồ ẩm thực
      </>
    ),
    desc: 'Quản lý thực đơn, theo dõi lượt khách ghé thăm và cập nhật thông tin quán của bạn tại Phố ẩm thực Vĩnh Khánh.',
    features: [
      { icon: TrendingUp, text: 'Thống kê lượt xem & ghé quán theo thời gian thực' },
      { icon: QrCode, text: 'Mã QR thuyết minh riêng cho từng món / quầy hàng' },
      { icon: Headphones, text: 'Thuyết minh đa ngôn ngữ giúp khách quốc tế dễ tiếp cận' },
    ],
    footnote: 'Chưa có gian hàng nào? Đăng ký làm đối tác ngay hôm nay.',
    formTitleKey: 'auth.ownerLoginTitle',
    formTitleFallback: 'Kênh Chủ Quán / Đối Tác',
    formDescKey: 'auth.ownerLoginDesc',
    formDescFallback: 'Quản lý thông tin địa điểm và thực đơn món ăn của bạn',
    icon: Store,
  },
  admin: {
    badge: 'Khu Vực Quản Trị',
    title: (
      <>
        Bảng điều khiển
        <br />
        quản trị hệ thống
      </>
    ),
    desc: 'Quản lý người dùng, kiểm duyệt địa điểm, ngôn ngữ thuyết minh và toàn bộ dữ liệu vận hành của VinhKhanh Explorer.',
    features: [
      { icon: LayoutDashboard, text: 'Tổng quan hoạt động theo thời gian thực' },
      { icon: Users, text: 'Quản lý tài khoản đối tác & quyền truy cập' },
      { icon: BarChart3, text: 'Báo cáo, thống kê và nhật ký kiểm toán' },
    ],
    footnote: 'Khu vực giới hạn — chỉ dành cho quản trị viên được cấp quyền.',
    formTitleKey: 'auth.adminLoginTitle',
    formTitleFallback: 'Admin Control Panel',
    formDescKey: 'auth.adminLoginDesc',
    formDescFallback: 'Manage users, approvals, language translations, and audio systems',
    icon: ShieldCheck,
  },
} as const;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<LoginTab>('owner');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const content = TAB_CONTENT[tab];
  const isOwner = tab === 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toastError(t('auth.fieldsRequired', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'));
      return;
    }

    setLoading(true);
    try {
      // Lưu ý: backend tự nhận diện Admin hay Owner dựa trên thông tin đăng
      // nhập (kiểm tra bảng AdminUsers trước, fallback sang Owners), không
      // phụ thuộc vào tab người dùng đang chọn trên UI. Tab ở đây chỉ đổi
      // giao diện/branding để người dùng dễ định hướng, không gửi thêm field
      // "role" nào lên server.
      const role = await login(username, password);
      success(t('auth.loginSuccess', 'Đăng nhập thành công!'));
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/owner');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const errMsg = err.response?.data?.message || t('auth.loginFailed', 'Đăng nhập thất bại.');
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex text-text-primary">
      {/* ============ LEFT — Branding panel, đổi theme theo tab (hidden on mobile) ============ */}
      <div
        className={[
          'hidden lg:flex w-[44%] relative overflow-hidden text-white flex-col justify-between p-10 transition-colors duration-500',
          isOwner ? 'bg-primary' : 'bg-text-primary',
        ].join(' ')}
      >
        {/* Decorative background, đổi theo tab */}
        {isOwner ? (
          <>
            <div className="absolute -top-20 -left-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-4rem] right-[-3rem] w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
          </>
        )}

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-2.5 animate-fade-in">
          <div
            className={[
              'w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0',
              isOwner ? 'bg-white' : 'bg-primary',
            ].join(' ')}
          >
            <content.icon size={18} className={isOwner ? 'text-primary' : 'text-white'} />
          </div>
          <span className="font-display font-extrabold text-sm tracking-wide">
            VinhKhanh <span className={isOwner ? 'text-secondary-light' : 'text-primary-light'}>Explorer</span>
          </span>
        </div>

        {/* Middle: headline, đổi theo tab (key=tab để re-trigger animation khi đổi) */}
        <div key={tab} className="relative z-10 flex flex-col gap-5 max-w-sm animate-slide-up">
          <span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1">
            {content.badge}
          </span>
          <h1 className="font-display font-extrabold text-3xl leading-tight tracking-tight">
            {content.title}
          </h1>
          <p className={['text-sm leading-relaxed', isOwner ? 'text-white/80' : 'text-white/60'].join(' ')}>
            {content.desc}
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {content.features.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className={[
                  'flex items-center gap-3 text-xs animate-slide-in-right',
                  isOwner ? 'text-white/90' : 'text-white/75',
                ].join(' ')}
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon size={13} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: footnote */}
        <div
          key={`${tab}-footnote`}
          className={[
            'relative z-10 text-[10px] tracking-wide animate-fade-in',
            isOwner ? 'text-white/60' : 'text-white/40',
          ].join(' ')}
        >
          {content.footnote}
        </div>
      </div>

      {/* ============ RIGHT — Form, dùng chung cho cả 2 tab ============ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <Link
          to="/"
          className="absolute top-5 left-5 sm:top-6 sm:left-6 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{t('auth.backToMap', 'Về bản đồ')}</span>
        </Link>

        <div className="w-full max-w-sm flex flex-col gap-6 animate-fade-in">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-alt border border-border">
            {(['owner', 'admin'] as LoginTab[]).map((key) => {
              const isActive = tab === key;
              const Icon = TAB_CONTENT[key].icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={[
                    'h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none',
                    isActive
                      ? 'bg-card text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary',
                  ].join(' ')}
                >
                  <Icon size={14} />
                  <span>{key === 'owner' ? 'Chủ Quán' : 'Quản Trị'}</span>
                </button>
              );
            })}
          </div>

          <div key={`${tab}-heading`} className="flex flex-col gap-1.5 text-center lg:text-left animate-fade-in">
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-text-primary">
              {t(content.formTitleKey, content.formTitleFallback)}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t(content.formDescKey, content.formDescFallback)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {t('auth.username', 'Tên đăng nhập')}
              </label>
              <div className="relative flex items-center group">
                <User size={16} className="absolute left-3.5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.usernamePlaceholder', 'Nhập tên đăng nhập...')}
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {t('auth.password', 'Mật khẩu')}
              </label>
              <div className="relative flex items-center group">
                <Lock size={16} className="absolute left-3.5 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder', 'Nhập mật khẩu...')}
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                'mt-2 h-11 w-full rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer outline-none disabled:opacity-60',
                isOwner ? 'bg-primary hover:bg-primary-hover' : 'bg-text-primary hover:bg-text-primary/90',
              ].join(' ')}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  {!isOwner && <ShieldCheck size={16} />}
                  <span>{t('auth.login', 'Đăng nhập')}</span>
                </>
              )}
            </button>
          </form>

          {/* Redirect to register — chỉ hiện cho tab Owner */}
          {isOwner ? (
            <div className="text-center text-xs text-text-secondary border-t border-border/60 pt-5">
              <span>{t('auth.noAccount', 'Chưa có tài khoản?')}</span>{' '}
              <Link to="/owner/register" className="text-primary font-bold hover:underline">
                {t('auth.registerNow', 'Đăng ký làm đối tác')}
              </Link>
            </div>
          ) : (
            <p className="text-center text-[10px] text-text-muted leading-relaxed border-t border-border/60 pt-5">
              {t('auth.adminRestrictedHint', 'Khu vực giới hạn — chỉ dành cho quản trị viên được cấp quyền.')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}