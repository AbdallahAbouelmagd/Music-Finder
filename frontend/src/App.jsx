import { useState } from "react";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "transparent",
      paper: "rgba(18, 14, 32, 0.72)",
    },
    primary: {
      main: "#ff2d95",
    },
    secondary: {
      main: "#d6ff4a",
    },
    text: {
      primary: "#f6f3ff",
      secondary: "rgba(246, 243, 255, 0.68)",
    },
  },
  typography: {
    fontFamily: '"Outfit", system-ui, sans-serif',
    h1: {
      fontFamily: '"Syne", "Outfit", sans-serif',
      fontWeight: 800,
    },
    h4: {
      fontFamily: '"Syne", "Outfit", sans-serif',
      fontWeight: 800,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

const SUGGESTIONS = ["Blinding Lights", "Frank Ocean", "Kendrick Lamar"];

const glass = {
  background: "rgba(18, 14, 32, 0.62)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.28)",
};

function Artwork({ song, size = 64 }) {
  if (song.artwork) {
    return (
      <Box
        component="img"
        src={song.artwork}
        alt=""
        sx={{
          width: size,
          height: size,
          borderRadius: 2.5,
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2.5,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, rgba(255,45,149,0.35), rgba(124,92,255,0.45))",
      }}
    >
      <MusicNoteIcon sx={{ fontSize: size * 0.42 }} />
    </Box>
  );
}

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [searchError, setSearchError] = useState("");

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  function handleSearch() {
    searchSongs(searchQuery);
  }

  async function searchSongs(value) {
    const query = value.trim();

    if (!query || query.length < 2) {
      return;
    }

    setSearchQuery(query);
    setLoadingSearch(true);
    setSearchError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();
      const results = data.results || [];

      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("Nothing matched that. Try another title or artist.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setSearchError("Search is unavailable right now. Is the API running?");
    } finally {
      setLoadingSearch(false);
    }
  }

  async function getRecommendations(song) {
    if (!song) {
      return;
    }

    setSelectedSong(song);
    setSearchResults([]);
    setRecommendations([]);
    setLoadingRecommendations(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          song: `${song.title} - ${song.artist}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Recommendation request failed");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Recommendation request failed:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box className="stage" sx={{ minHeight: "100svh" }}>
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pt: { xs: 7, md: 11 },
              pb: 10,
              px: { xs: 0.5, sm: 0 },
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.6,
                mb: 3,
                borderRadius: 99,
                color: "#d6ff4a",
                background: "rgba(214, 255, 74, 0.1)",
                border: "1px solid rgba(214, 255, 74, 0.28)",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
              Pick a song. Get five more.
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "3rem", md: "5.2rem" },
                lineHeight: 0.92,
                textAlign: "center",
                letterSpacing: "-0.05em",
              }}
            >
              Find the
              <Box
                component="span"
                sx={{
                  display: "block",
                  background:
                    "linear-gradient(100deg, #ff2d95 10%, #c084fc 45%, #d6ff4a 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                next track
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 2.5,
                mb: 4.5,
                maxWidth: 460,
                textAlign: "center",
                color: "text.secondary",
                fontSize: { xs: "1.05rem", md: "1.2rem" },
              }}
            >
              Search a song you already love. We’ll line up five that sit in
              the same pocket.
            </Typography>

            <Box sx={{ width: "100%", maxWidth: 720 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.25,
                  flexDirection: { xs: "column", sm: "row" },
                  p: 1,
                  borderRadius: 6,
                  ...glass,
                }}
              >
                <TextField
                  fullWidth
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Song or artist"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 4,
                      backgroundColor: "rgba(7, 6, 13, 0.55)",
                      fontSize: "1.08rem",
                      minHeight: 60,
                      "& fieldset": {
                        borderColor: "transparent",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.16)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#ff2d95",
                      },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loadingSearch}
                  startIcon={
                    loadingSearch ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  sx={{
                    minWidth: { sm: 148 },
                    minHeight: 60,
                    borderRadius: 4,
                    textTransform: "none",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#1a1020",
                    background:
                      "linear-gradient(120deg, #ff2d95 0%, #ff7ac8 45%, #d6ff4a 140%)",
                    boxShadow: "0 10px 30px rgba(255, 45, 149, 0.35)",
                    "&:hover": {
                      background:
                        "linear-gradient(120deg, #ff4aa3 0%, #ff8fd0 45%, #e4ff7a 140%)",
                    },
                  }}
                >
                  Search
                </Button>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 2,
                  justifyContent: "center",
                }}
              >
                {SUGGESTIONS.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    clickable
                    onClick={() => searchSongs(name)}
                    sx={{
                      color: "text.primary",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      "&:hover": {
                        background: "rgba(255, 45, 149, 0.16)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {searchError && (
              <Typography
                sx={{
                  mt: 3,
                  color: "#ffb4d6",
                  textAlign: "center",
                }}
              >
                {searchError}
              </Typography>
            )}

            {searchResults.length > 0 && (
              <Box sx={{ width: "100%", maxWidth: 720, mt: 4 }}>
                <Typography
                  sx={{
                    mb: 1.5,
                    color: "text.secondary",
                    fontSize: "0.85rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Tap a song
                </Typography>

                {searchResults.map((song) => (
                  <Box
                    key={song.id}
                    component="button"
                    type="button"
                    onClick={() => getRecommendations(song)}
                    sx={{
                      width: "100%",
                      mb: 1.25,
                      p: 1.25,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      textAlign: "left",
                      color: "inherit",
                      cursor: "pointer",
                      borderRadius: 4,
                      ...glass,
                      transition: "transform 0.18s ease, border-color 0.18s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: "rgba(255, 45, 149, 0.55)",
                      },
                    }}
                  >
                    <Artwork song={song} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {song.title}
                      </Typography>
                      <Typography color="text.secondary" noWrap>
                        {song.artist}
                        {song.album ? ` · ${song.album}` : ""}
                        {song.year ? ` · ${song.year}` : ""}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        display: { xs: "none", sm: "block" },
                        px: 1.4,
                        py: 0.6,
                        borderRadius: 99,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1a1020",
                        background: "#d6ff4a",
                        flexShrink: 0,
                      }}
                    >
                      Similar
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {selectedSong && (
              <Box sx={{ width: "100%", maxWidth: 720, mt: 6 }}>
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2.5,
                    background:
                      "linear-gradient(135deg, rgba(255,45,149,0.28), rgba(124,92,255,0.22) 55%, rgba(214,255,74,0.12))",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "0 20px 50px rgba(255, 45, 149, 0.12)",
                  }}
                >
                  <Artwork song={selectedSong} size={92} />
                  <Box sx={{ minWidth: 0, textAlign: "left" }}>
                    <Typography
                      sx={{
                        color: "#d6ff4a",
                        fontSize: "0.75rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Now digging
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        mt: 0.5,
                        fontSize: { xs: "1.6rem", sm: "2rem" },
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {selectedSong.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedSong.artist}
                      {selectedSong.album ? ` · ${selectedSong.album}` : ""}
                      {selectedSong.year ? ` · ${selectedSong.year}` : ""}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {loadingRecommendations && (
              <Box
                sx={{
                  mt: 7,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box className="eq" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </Box>
                <Typography color="text.secondary">
                  Tuning the next five…
                </Typography>
              </Box>
            )}

            {!loadingRecommendations && recommendations.length > 0 && (
              <Box sx={{ width: "100%", maxWidth: 720, mt: 6 }}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 2.5,
                    textAlign: "left",
                    letterSpacing: "-0.04em",
                    fontSize: { xs: "1.8rem", sm: "2.2rem" },
                  }}
                >
                  In the same lane
                </Typography>

                {recommendations.map((song, index) => (
                  <Box
                    key={`${song.title}-${song.artist}-${index}`}
                    sx={{
                      mb: 1.5,
                      p: 2,
                      display: "flex",
                      gap: 2,
                      textAlign: "left",
                      borderRadius: 4,
                      ...glass,
                      transition: "transform 0.18s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontWeight: 800,
                        fontSize: "1.35rem",
                        minWidth: 36,
                        background:
                          "linear-gradient(180deg, #ff2d95, #d6ff4a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </Typography>
                    <Box>
                      <Typography fontWeight={700} fontSize="1.15rem">
                        {song.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {song.artist}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 1,
                          color: "rgba(246, 243, 255, 0.82)",
                          lineHeight: 1.5,
                        }}
                      >
                        {song.reason}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
