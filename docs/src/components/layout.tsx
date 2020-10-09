/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useContext } from "react"
import clsx from 'clsx';
import { makeStyles, Container, Hidden, Box, Tooltip, Zoom } from '@material-ui/core';
// tslint:disable-next-line: no-submodule-imports
import { Link, IconButton, Fab } from 'gatsby-theme-material-ui';
// tslint:disable-next-line: no-submodule-imports
import CssBaseline from '@material-ui/core/CssBaseline';
// tslint:disable-next-line: no-submodule-imports
import AppBar from '@material-ui/core/AppBar';
// tslint:disable-next-line: no-submodule-imports
import Toolbar from '@material-ui/core/Toolbar';
// tslint:disable-next-line: no-submodule-imports
import Typography from '@material-ui/core/Typography';
import ConnectButton from '../jacdac/ConnectButton';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import HistoryIcon from '@material-ui/icons/History';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import MenuIcon from '@material-ui/icons/Menu';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import AccountTreeIcon from '@material-ui/icons/AccountTree';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import MoreIcon from '@material-ui/icons/MoreVert';
import { useStaticQuery, graphql } from "gatsby"
import JACDACProvider from "../jacdac/Provider"
import ErrorSnackbar from "./ErrorSnackbar"
// tslint:disable-next-line: no-import-side-effect
import "./layout.css"
import PacketsContext, { PacketsProvider } from "./PacketsContext";
import SEO from "./seo";
import { DbProvider } from "./DbContext";
import FlashButton from "./FlashButton";
// tslint:disable-next-line: no-submodule-imports
import { createMuiTheme, responsiveFontSizes, ThemeProvider, createStyles, useTheme } from '@material-ui/core/styles';
import AppContext, { AppProvider, DrawerType } from "./AppContext";
import AppDrawer from "./AppDrawer";
import WebUSBAlert from "./WebUSBAlert";
import useFirmwareBlobs from "./useFirmwareBlobs";
import { MDXProvider } from "@mdx-js/react";
import { ServiceManagerProvider } from "./ServiceManagerContext";
import DarkModeProvider from "./DarkModeProvider";
import DarkModeContext from "./DarkModeContext";
import ToolsDrawer from "./ToolsDrawer";
import Helmet from "react-helmet";
import Alert from "./Alert"
import JACDACContext, { JDContextProps } from "../../../src/react/Context";
import { BusState } from "../../../src/dom/bus";
import GitHubButton from "./GitHubButton"
import Presentation from "./Presentation";
import useMdxComponents from "./useMdxComponents";
import Footer from "./Footer";
import HideOnScroll from "./HideOnScroll";
import TraceRecordButton from "./TraceRecordButton"
import TracePlayButton from "./TracePlayButton";

export const DRAWER_WIDTH = 40;
export const TOOLS_DRAWER_WIDTH = 22;
export const MOBILE_DRAWER_WIDTH = 20;
export const MOBILE_TOOLS_DRAWER_WIDTH = 18;
export const MOBILE_BREAKPOINT = "md"

const useStyles = makeStyles((theme) => createStyles({
  root: {
    display: 'flex',
    flexGrow: 1
  },
  grow: {
    flexGrow: 1,
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${DRAWER_WIDTH}rem)`,
    marginLeft: `${DRAWER_WIDTH}rem`,
    [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
      width: `calc(100% - ${MOBILE_DRAWER_WIDTH}rem)`,
      marginLeft: `${MOBILE_DRAWER_WIDTH}rem`,
    },
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  toolBarShift: {
    width: `calc(100% - ${TOOLS_DRAWER_WIDTH}rem)`,
    marginRight: `${TOOLS_DRAWER_WIDTH}rem`,
    [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
      width: `calc(100% - ${MOBILE_TOOLS_DRAWER_WIDTH}rem)`,
      marginRight: `${MOBILE_TOOLS_DRAWER_WIDTH}rem`,
    },
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  hideMobile: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    }
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    display: 'flex',
    minHeight: '100vh',
    minWidth: '10rem',
    flexDirection: 'column',
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    flexGrow: 1
  },
  mainContent: {
    flexGrow: 1
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  toolsContentShift: {
    width: `calc(100% - 0.5rem)`,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `-${TOOLS_DRAWER_WIDTH}rem`,
    [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
      marginLeft: `-${MOBILE_TOOLS_DRAWER_WIDTH}rem`,
    }
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    "& > *": {
      margin: theme.spacing(1)
    }
  },
}));

export default function Layout(props: { pageContext?: any; children: any; }) {
  return <DarkModeProvider>
    <LayoutWithDarkMode {...props} />
  </DarkModeProvider>
}

function LayoutWithDarkMode(props: { pageContext?: any; children: any; }) {
  const { darkMode, darkModeMounted } = useContext(DarkModeContext)
  const rawTheme = createMuiTheme({
    palette: {
      type: darkMode
    }
  })
  const theme = responsiveFontSizes(rawTheme);
  const mdxComponents = useMdxComponents()

  if (!darkModeMounted)
    return <div />

  return (
    <ThemeProvider theme={theme}>
      <MDXProvider components={mdxComponents}>
        <JACDACProvider>
          <ServiceManagerProvider>
            <PacketsProvider>
              <DbProvider>
                <AppProvider>
                  <LayoutWithContext {...props} />
                </AppProvider>
              </DbProvider>
            </PacketsProvider>
          </ServiceManagerProvider>
        </JACDACProvider>
      </MDXProvider>
    </ThemeProvider>
  )
}

function MainAppBar(props: { pageContext?: any }) {
  const { pageContext } = props;
  const classes = useStyles();
  const { recording, trace } = useContext(PacketsContext)
  const { drawerType, setDrawerType, toolsMenu, setToolsMenu } = useContext(AppContext)
  const { darkMode } = useContext(DarkModeContext)
  const drawerOpen = drawerType !== DrawerType.None
  const pageTitle = pageContext?.frontmatter?.title;
  const pageDeck = !!pageContext?.frontmatter?.deck;
  const appBarColor = pageDeck ? "transparent" : darkMode === "dark" ? "inherit" : undefined;

  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)
  const title = data.site.siteMetadata.title;

  const handleDrawerToc = () => {
    setDrawerType(DrawerType.Toc)
  }
  const handleDrawerConsole = () => {
    setDrawerType(DrawerType.Packets);
  }
  const handleDrawerDom = () => {
    setDrawerType(DrawerType.Dom);
  }
  const toggleToolsMenu = () => setToolsMenu(!toolsMenu)

  return <AppBar position="fixed"
    elevation={pageDeck ? 0 : 2}
    color={appBarColor}
    className={clsx(classes.appBar, {
      [classes.appBarShift]: drawerOpen,
      [classes.toolBarShift]: toolsMenu,
    })}
  >
    <Toolbar>
      <Tooltip aria-label="open table of contents" title="open table of contents" className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)}>
        <span>
          <IconButton
            color="inherit"
            onClick={handleDrawerToc}
            edge="start"
          > <MenuIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip aria-label="open device tree" title="open DOM tree" className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)}>
        <span>
          <IconButton
            color="inherit"
            onClick={handleDrawerDom}
            edge="start"
          > <AccountTreeIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip aria-label="open packet console" title="open packet console" className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)}>
        <span>
          <IconButton
            color="inherit"
            onClick={handleDrawerConsole}
            edge="start"
          > <HistoryIcon />
          </IconButton>
        </span>
      </Tooltip>
      {!drawerOpen && !toolsMenu && <Hidden mdDown={true}>
        <Typography variant="h6">
          <Link className={classes.menuButton} href="/jacdac-ts" color="inherit">{title}</Link>
        </Typography>
        {pageTitle && pageTitle !== "JACDAC" &&
          <Typography variant="h5">
            {"/"} {pageTitle}
          </Typography>}
      </Hidden>}
      <div className={classes.grow} />
      <div className={clsx(classes.menuButton)}><ConnectButton transparent={true} /></div>
      <GitHubButton className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)} repo={"microsoft/jacdac"} />
      <div className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)}><FlashButton /></div>
      <IconButton color="inherit" className={clsx(classes.menuButton, drawerOpen && classes.hideMobile)} onClick={toggleToolsMenu} aria-label="More">
        <MoreIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
}

function FabBar() {
  const classes = useStyles();
  const theme = useTheme();
  const { trace } = useContext(PacketsContext)

  return <div className={classes.fab}>
    {trace && <Zoom in={true}>
      <Fab color="primary" aria-label="play trace">
        <TracePlayButton component="span" color="inherit" progressColor="inherit" progressSize={theme.spacing(6)} />
      </Fab>
    </Zoom>}
    <Zoom in={true}>
      <Fab color="secondary" aria-label="record trace">
        <TraceRecordButton component="span" color="inherit" progressColor="inherit" progressSize={theme.spacing(6)} />
      </Fab>
    </Zoom>
  </div>
}

function LayoutWithContext(props: {
  pageContext?: any;
  children: any;
}) {
  const { pageContext, children, } = props;
  const classes = useStyles();
  const { drawerType, toolsMenu } = useContext(AppContext)
  useFirmwareBlobs();
  const drawerOpen = drawerType !== DrawerType.None
  const serviceClass = pageContext?.node?.classIdentifier;
  const pagePath = pageContext?.frontmatter?.path;
  const pageDeck = !!pageContext?.frontmatter?.deck;

  return (<>
    <div className={classes.root}>
      <SEO />
      <CssBaseline />
      <Helmet>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
        />
      </Helmet>
      <HideOnScroll>
        <div><MainAppBar pageContext={pageContext} /></div>
      </HideOnScroll>
      <AppDrawer pagePath={pagePath} serviceClass={serviceClass} />
      <ToolsDrawer />
      {pageDeck && <Presentation>
        {children}
      </Presentation>}
      {!pageDeck && <Container disableGutters={true}>
        <main
          className={clsx(classes.content, {
            [classes.contentShift]: drawerOpen,
            [classes.toolsContentShift]: toolsMenu,
          })}
        >
          <div className={classes.mainContent}>
            <div className={classes.drawerHeader} />
            <Alert closeable={true} severity="warning">UNDER CONSTRUCTION - We are still working and changing the JACDAC specification. Do not build devices using JACDAC.</Alert>
            <WebUSBAlert />
            <Typography className={'markdown'} component="span">
              {children}
            </Typography>
          </div>
          <Footer />
        </main>
      </Container>}
      <ErrorSnackbar />
      <FabBar />
    </div>
  </>
  )
}
