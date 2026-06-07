import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getBusinessRefreshKey, useBusinessNavigate } from '@/app/businessNavigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { useAlerts, useUpdateAlert } from '@/modules/alerts/hooks/useAlerts';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/utils/format';
import { brandColors, headingFont, premiumShadows } from '@/app/theme';

const DRAWER_FULL = 260;
const DRAWER_COLLAPSED = 72;

const menuGroups = [
  {
    label: 'Général',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Clients', path: '/clients', icon: <PeopleAltRoundedIcon fontSize="small" /> },
      // { label: 'Banques', path: '/banks', icon: <AccountBalanceRoundedIcon fontSize="small" /> },
      { label: 'Comptes', path: '/accounts', icon: <AccountBalanceWalletRoundedIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { label: 'Chèques / Traites', path: '/payment-items', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Suivi',
    items: [
      { label: 'Alertes', path: '/alerts', icon: <NotificationsActiveRoundedIcon fontSize="small" /> },
      { label: 'Paramètres', path: '/settings', icon: <SettingsRoundedIcon fontSize="small" /> },
    ],
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const businessNavigate = useBusinessNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
  const { logout, user } = useAuth();
  const { data: alerts = [] } = useAlerts();
  const updateAlert = useUpdateAlert();

  const totalAlerts = alerts.length;
  const unreadAlerts = alerts.filter((alert) => !alert.isRead).length;
  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED : DRAWER_FULL;
  const menuRefreshKey = getBusinessRefreshKey(location.state);

  const navigateWithRefresh = useCallback((path: string) => {
    businessNavigate(path);

    setMobileOpen(false);
    setNotifAnchor(null);
    setUserAnchor(null);
  }, [businessNavigate]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
  };

  const currentPageLabel = useMemo(() => {
    for (const group of menuGroups) {
      const found = group.items.find((item) => item.path === location.pathname);
      if (found) return found.label;
    }
    return 'Flux Financier';
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const labels: Record<string, string> = {
      dashboard: 'Dashboard', clients: 'Clients', banks: 'Banques', accounts: 'Comptes',
      'payment-items': 'Chèques / Traites',
      alerts: 'Alertes', settings: 'Paramètres',
    };
    return segments.map((s) => labels[s] || s);
  }, [location.pathname]);

  const isCollapsed = collapsed && !isMobile;

  const drawer = useMemo(
    () => (
      <Box
        sx={{
          height: '100%',
          backgroundColor: '#FAFBFD',
          borderRight: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
        }}
      >
        {/* ── Logo zone ── */}
        <Box
          sx={{
            px: isCollapsed ? 1.5 : 2.5,
            pt: 2.5,
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            minHeight: 68,
          }}
        >
          {isCollapsed ? (
            <BrandLogo collapsed />
          ) : (
            <BrandLogo variant="full" height={36} />
          )}
        </Box>

        <Divider sx={{ borderColor: brandColors.slate[200], mx: isCollapsed ? 1 : 2 }} />

        {/* ── Menu groups ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: isCollapsed ? 0.8 : 1.5, pt: 2 }}>
          {menuGroups.map((group, gi) => (
            <Box key={group.label} sx={{ mb: gi < menuGroups.length - 1 ? 2 : 0 }}>
              {!isCollapsed && (
                <Typography
                  sx={{
                    color: brandColors.slate[400],
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    px: 1.5,
                    pt: 0.8,
                    pb: 0.8,
                    display: 'block',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                </Typography>
              )}
              <List disablePadding>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isAlerts = item.path === '/alerts';

                  const button = (
                    <ListItemButton
                      key={item.path}
                      selected={isActive}
                      onClick={() => {
                        navigateWithRefresh(item.path);
                      }}
                      sx={{
                        borderRadius: '10px',
                        color: isActive ? brandColors.blue[700] : brandColors.slate[600],
                        mb: 0.3,
                        py: isCollapsed ? 1.1 : 0.9,
                        px: isCollapsed ? 0 : 1.5,
                        minHeight: isCollapsed ? 46 : 42,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        backgroundColor: isActive ? alpha(brandColors.blue[600], 0.07) : 'transparent',
                        // Left accent indicator for active item
                        '&::before': isActive && !isCollapsed ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: 20,
                          borderRadius: '0 3px 3px 0',
                          backgroundColor: brandColors.blue[600],
                        } : {},
                        '&.Mui-selected': {
                          backgroundColor: alpha(brandColors.blue[600], 0.07),
                          '&:hover': {
                            backgroundColor: alpha(brandColors.blue[600], 0.11),
                          },
                        },
                        '&:hover': {
                          backgroundColor: isActive
                            ? alpha(brandColors.blue[600], 0.11)
                            : alpha(brandColors.slate[500], 0.05),
                          color: isActive ? brandColors.blue[700] : brandColors.slate[800],
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? brandColors.blue[700] : brandColors.slate[400],
                          minWidth: isCollapsed ? 0 : 36,
                          justifyContent: 'center',
                          transition: 'color 0.15s',
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.18rem',
                          },
                        }}
                      >
                        {isAlerts && totalAlerts > 0 ? (
                          <Badge badgeContent={totalAlerts} color="error" max={99} sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      {!isCollapsed && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.88rem',
                            fontWeight: isActive ? 600 : 500,
                            letterSpacing: '0.005em',
                            lineHeight: 1.4,
                          }}
                        />
                      )}
                    </ListItemButton>
                  );

                  return isCollapsed ? (
                    <Tooltip key={item.path} title={item.label} placement="right" arrow>
                      {button}
                    </Tooltip>
                  ) : (
                    <Box key={item.path}>{button}</Box>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* ── Collapse toggle ── */}
        {!isMobile && (
          <>
            <Divider sx={{ borderColor: brandColors.slate[200], mx: isCollapsed ? 1 : 2 }} />
            <Box sx={{ px: isCollapsed ? 0.8 : 1.5, py: 1, display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end' }}>
              <IconButton
                size="small"
                onClick={toggleCollapse}
                sx={{
                  color: brandColors.slate[400],
                  '&:hover': { color: brandColors.slate[600], backgroundColor: brandColors.slate[100] },
                }}
              >
                {isCollapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
              </IconButton>
            </Box>
          </>
        )}

        {/* ── Bottom user zone ── */}
        <Divider sx={{ borderColor: alpha(brandColors.slate[200], 0.7), mx: isCollapsed ? 1 : 2 }} />
        <Box sx={{ px: isCollapsed ? 0.8 : 1.5, py: 1.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={isCollapsed ? 0 : 1.2}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            sx={{
              ...(!isCollapsed && {
                px: 1,
                py: 0.8,
                borderRadius: '10px',
                backgroundColor: alpha(brandColors.slate[100], 0.6),
                border: `1px solid ${alpha(brandColors.slate[200], 0.5)}`,
              }),
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.8rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${brandColors.blue[500]}, ${brandColors.blue[700]})`,
                color: '#FFFFFF',
                boxShadow: `0 2px 6px ${alpha(brandColors.blue[600], 0.25)}`,
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            {!isCollapsed && (
              <>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: brandColors.slate[800], lineHeight: 1.3 }} noWrap>
                    {user?.username || 'Utilisateur'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: brandColors.slate[400], lineHeight: 1.3 }} noWrap>
                    {user?.email || 'admin@flux.ma'}
                  </Typography>
                </Box>
                <Tooltip title="Déconnexion" arrow>
                  <IconButton
                    size="small"
                    onClick={() => { logout(); navigate('/login'); }}
                    sx={{ color: brandColors.slate[400], '&:hover': { color: '#DC2626', backgroundColor: alpha('#DC2626', 0.06) } }}
                  >
                    <LogoutRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    ),
    [location.pathname, navigateWithRefresh, user, logout, isCollapsed, isMobile, totalAlerts, toggleCollapse]
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F6FA' }}>
      <CssBaseline />

      {/* ── Header ── */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: `1px solid ${alpha(brandColors.slate[200], 0.8)}`,
          backgroundColor: alpha('#FFFFFF', 0.85),
          backdropFilter: 'blur(12px)',
          zIndex: (t) => t.zIndex.drawer + 1,
          transition: 'width 0.25s ease, margin-left 0.25s ease',
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, md: 64 }, px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen((v) => !v)} sx={{ mr: 0.5, color: brandColors.slate[600] }}>
              <MenuRoundedIcon />
            </IconButton>
          )}

          {/* Page title + breadcrumb */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                fontFamily: headingFont,
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                color: brandColors.slate[800],
              }}
            >
              {currentPageLabel}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography sx={{ color: brandColors.slate[400], fontSize: '0.75rem', fontWeight: 500 }}>
                Accueil
              </Typography>
              {breadcrumbs.map((segment, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={0.5}>
                  <Typography sx={{ color: brandColors.slate[300], fontSize: '0.75rem' }}>/</Typography>
                  <Typography sx={{ color: i === breadcrumbs.length - 1 ? brandColors.blue[600] : brandColors.slate[400], fontSize: '0.75rem', fontWeight: i === breadcrumbs.length - 1 ? 600 : 500 }}>
                    {segment}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Search bar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <GlobalSearch />
          </Box>

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${brandColors.slate[200]}`,
                transition: 'all 0.18s ease',
                '&:hover': { backgroundColor: brandColors.slate[50], borderColor: brandColors.slate[300], transform: 'translateY(-1px)' },
              }}
            >
              <Badge badgeContent={totalAlerts} color="error" max={99}>
                <NotificationsNoneRoundedIcon sx={{ color: brandColors.slate[500], fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar (desktop) */}
          {!isMobile && (
            <Box
              onClick={(e) => setUserAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                pl: 1,
                pr: 1.5,
                py: 0.5,
                borderRadius: '10px',
                border: `1px solid ${brandColors.slate[200]}`,
                backgroundColor: '#FFFFFF',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { backgroundColor: brandColors.slate[50], borderColor: brandColors.slate[300], transform: 'translateY(-1px)', boxShadow: premiumShadows.xs },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${brandColors.blue[500]}, ${brandColors.blue[700]})`,
                  color: '#FFFFFF',
                  boxShadow: `0 1px 4px ${alpha(brandColors.blue[600], 0.2)}`,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || <PersonRoundedIcon fontSize="small" />}
              </Avatar>
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: brandColors.slate[700], lineHeight: 1.3 }} noWrap>
                  {user?.username || 'Utilisateur'}
                </Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, color: brandColors.slate[400] }} />
            </Box>
          )}

          {/* Notifications dropdown */}
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 440,
                mt: 1,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
                  Notifications
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {totalAlerts > 0 ? `${totalAlerts} alerte${totalAlerts > 1 ? 's' : ''}` : 'Aucune alerte'}
                </Typography>
              </Box>
              {unreadAlerts > 0 && (
                <Tooltip title="Tout marquer comme lu">
                  <IconButton
                    size="small"
                    sx={{ color: brandColors.blue[600] }}
                    onClick={() => {
                      alerts.filter((alert) => !alert.isRead).forEach((alert) => {
                        updateAlert.mutate({ id: alert.id, payload: { isRead: true } });
                      });
                    }}
                  >
                    <MarkEmailReadRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {alerts.slice(0, 6).map((alert) => (
              <MenuItem
                key={alert.id}
                onClick={() => navigateWithRefresh('/alerts')}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  mx: 0,
                  borderRadius: 0,
                  borderLeft: alert.isRead ? 'none' : `3px solid ${brandColors.blue[500]}`,
                  backgroundColor: alert.isRead ? 'transparent' : alpha(brandColors.blue[500], 0.03),
                  '&:hover': { backgroundColor: alpha(brandColors.blue[500], 0.06) },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: alert.isRead ? 500 : 650,
                      fontSize: '0.86rem',
                      color: 'text.primary',
                      mb: 0.3,
                    }}
                    noWrap
                  >
                    {alert.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatDate(alert.triggerDate || alert.createdAt)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            {!alerts.length && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <NotificationsNoneRoundedIcon sx={{ color: brandColors.slate[300], fontSize: 36, mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aucune notification</Typography>
              </Box>
            )}
            {alerts.length > 0 && (
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2.5, py: 1.2, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={() => navigateWithRefresh('/alerts')}
                  sx={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Voir toutes les alertes
                </Button>
              </Box>
            )}
          </Menu>

          {/* User dropdown */}
          <Menu
            anchorEl={userAnchor}
            open={Boolean(userAnchor)}
            onClose={() => setUserAnchor(null)}
            PaperProps={{ sx: { width: 200, mt: 1 } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigateWithRefresh('/settings')}>
              <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.88rem' }}>Paramètres</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setUserAnchor(null); logout(); navigate('/login'); }} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutRoundedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.88rem' }}>Déconnexion</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ── */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: 'width 0.25s ease',
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: isMobile ? DRAWER_FULL : drawerWidth,
              boxSizing: 'border-box',
              borderRight: 'none',
              overflowX: 'hidden',
              transition: 'width 0.25s ease',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3.5 },
          mt: '64px',
          minHeight: '100vh',
          backgroundColor: '#F5F6FA',
          maxWidth: { md: `calc(100% - ${drawerWidth}px)` },
          transition: 'max-width 0.25s ease',
        }}
      >
        <Outlet key={`${location.pathname}:${menuRefreshKey}`} />
      </Box>
    </Box>
  );
}

