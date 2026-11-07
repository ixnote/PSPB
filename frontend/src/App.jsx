import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { DocumentsPage } from './pages/admin/DocumentsPage';
import { ConflictIncidentsPage } from './pages/admin/ConflictIncidentsPage';
import { PeacebuildingActorsPage } from './pages/admin/PeacebuildingActorsPage';
import { ConflictMapPage } from './pages/admin/ConflictMapPage';
import { ConflictTrendsPage } from './pages/admin/ConflictTrendsPage';
import { ConflictMapPublicPage } from './pages/public/ConflictMapPublicPage';
import { ConflictDataPage } from './pages/public/ConflictDataPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContentPage } from './pages/public/ContentPage';
import { NewsPage } from './pages/public/NewsPage';
import { NewsPostPage } from './pages/public/NewsPostPage';
import { EventsPage } from './pages/public/EventsPage';
import { ContactPage } from './pages/public/ContactPage';
import { RepositoryPage } from './pages/public/RepositoryPage';
import { PartnersPage } from './pages/public/PartnersPage';
import { TeamPage } from './pages/public/TeamPage';
import { GalleriesPage } from './pages/public/GalleriesPage';
import { GalleryDetailPage } from './pages/public/GalleryDetailPage';
import { ContentPagesPage } from './pages/admin/ContentPagesPage';
import { NewsAdminPage } from './pages/admin/NewsAdminPage';
import { EventsAdminPage } from './pages/admin/EventsAdminPage';
import { OurWorkPage } from './pages/public/OurWorkPage';
import { ApplyPage } from './pages/public/ApplyPage';
import { ApplicationStatusPage } from './pages/public/ApplicationStatusPage';
import { ApplicationsPage } from './pages/admin/ApplicationsPage';
import { ContactMessagesPage } from './pages/admin/ContactMessagesPage';
import { NewsletterSubscribersPage } from './pages/admin/NewsletterSubscribersPage';
import { ApprovalsPage } from './pages/admin/ApprovalsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ChangePasswordPage } from './pages/admin/ChangePasswordPage';
import { GalleriesAdminPage } from './pages/admin/GalleriesAdminPage';
import { TeamMembersPage } from './pages/admin/TeamMembersPage';
import { PeacebuildingActorsPublicPage } from './pages/public/PeacebuildingActorsPublicPage';
import { VideosPage } from './pages/public/VideosPage';
import { VideosAdminPage } from './pages/admin/VideosAdminPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { DocumentRequestsPage } from './pages/admin/DocumentRequestsPage';
import { useAuth } from './hooks/useAuth';

function ProtectedAdmin({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="our-work" element={<OurWorkPage />} />
        <Route path="page/:slug" element={<ContentPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:slug" element={<NewsPostPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="repository" element={<RepositoryPage />} />
        <Route path="galleries" element={<GalleriesPage />} />
        <Route path="galleries/:slug" element={<GalleryDetailPage />} />
        <Route path="map" element={<ConflictMapPublicPage />} />
        <Route path="conflict-data" element={<ConflictDataPage />} />
        <Route path="peacebuilding-actors" element={<PeacebuildingActorsPublicPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="apply" element={<ApplyPage />} />
        <Route path="application-status" element={<ApplicationStatusPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="dashboard" element={<ProtectedAdmin><DashboardPage /></ProtectedAdmin>} />
        <Route path="documents" element={<ProtectedAdmin><DocumentsPage /></ProtectedAdmin>} />
        <Route path="conflict/incidents" element={<ProtectedAdmin><ConflictIncidentsPage /></ProtectedAdmin>} />
        <Route path="conflict/actors" element={<ProtectedAdmin><PeacebuildingActorsPage /></ProtectedAdmin>} />
        <Route path="conflict/map" element={<ProtectedAdmin><ConflictMapPage /></ProtectedAdmin>} />
        <Route path="conflict/trends" element={<ProtectedAdmin><ConflictTrendsPage /></ProtectedAdmin>} />
        <Route path="content/pages" element={<ProtectedAdmin><ContentPagesPage /></ProtectedAdmin>} />
        <Route path="content/news" element={<ProtectedAdmin><NewsAdminPage /></ProtectedAdmin>} />
        <Route path="content/events" element={<ProtectedAdmin><EventsAdminPage /></ProtectedAdmin>} />
        <Route path="content/galleries" element={<ProtectedAdmin><GalleriesAdminPage /></ProtectedAdmin>} />
        <Route path="content/videos" element={<ProtectedAdmin><VideosAdminPage /></ProtectedAdmin>} />
        <Route path="content/team" element={<ProtectedAdmin><TeamMembersPage /></ProtectedAdmin>} />
        <Route path="applications" element={<ProtectedAdmin><ApplicationsPage /></ProtectedAdmin>} />
        <Route path="document-requests" element={<ProtectedAdmin><DocumentRequestsPage /></ProtectedAdmin>} />
        <Route path="content/contact-messages" element={<ProtectedAdmin><ContactMessagesPage /></ProtectedAdmin>} />
        <Route path="content/newsletter-subscribers" element={<ProtectedAdmin><NewsletterSubscribersPage /></ProtectedAdmin>} />
        <Route path="content/approvals" element={<ProtectedAdmin><ApprovalsPage /></ProtectedAdmin>} />
        <Route path="users" element={<ProtectedAdmin><UsersPage /></ProtectedAdmin>} />
        <Route path="departments" element={<ProtectedAdmin><DepartmentsPage /></ProtectedAdmin>} />
        <Route path="change-password" element={<ProtectedAdmin><ChangePasswordPage /></ProtectedAdmin>} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
