import { BreakpointKeys, Orientation } from '../utils/display';
import { NavIcon, navIcons } from '../utils/images';
import SvgIcon from '@mui/material/SvgIcon';
import { AppBar, Box, Toolbar, Typography, useTheme } from '@mui/material';

interface NavigationProps {
  height: number;
  mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>;
}

export default function Navigation(props: NavigationProps) {
  const theme = useTheme();

  const createIcon = (navIcon: NavIcon) => {
    return (
      <a
        href={navIcon.href}
        title={navIcon.title}
        style={{
          marginLeft: 5,
          marginRight: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <SvgIcon
          viewBox={navIcon.viewBox}
          fontSize={'large'}
          htmlColor={'#000'}
          sx={{
            '&:hover': {
              fill: theme.palette.primary.main,
            },
          }}
        >
          {navIcon.paths.map((path, i) => (
            <path key={i} d={path}></path>
          ))}
        </SvgIcon>
      </a>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, height: props.height }}>
      <AppBar
        position='static'
        sx={{
          backgroundColor: theme.palette.common.white,
          position: 'relative',
          boxSizing: 'border-box',
          height: props.height,
          overflow: 'hidden',
        }}
      >
        <Toolbar style={{ height: '100%' }}>
          <Typography
            variant='h5'
            sx={{
              fontSize: `min(5vw, ${props.height * 0.7}px)`,
              fontFamily: 'Allura',
              color: theme.palette.text.primary,
            }}
          >
            Michael Scully
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex' }}>{navIcons.map((icon) => createIcon(icon))}</Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
