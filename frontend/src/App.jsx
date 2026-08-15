import { useState } from "react";

import {
  Button,
  Box,
  Card,
  CardContent,
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

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#09090b",
      paper: "#15151a",
    },
    primary: {
      main: "#a855f7",
    },
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
  },
});

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(false);

  function handleSearch() {
    searchSongs(searchQuery);
  }

  async function searchSongs(value) {
    const query = value.trim();

    if (!query || query.length < 2) {
      return;
    }

    setLoadingSearch(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
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
      const response = await fetch(
        "http://127.0.0.1:8000/recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            song: `${song.title} - ${song.artist}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Recommendation request failed");
      }

      const data = await response.json();

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error(
        "Recommendation request failed:",
        error
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: {
              xs: 8,
              md: 14,
            },
            pb: 8,
          }}
        >
          <MusicNoteIcon
            sx={{
              fontSize: 52,
              color: "primary.main",
              mb: 2,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: {
                xs: "2.5rem",
                md: "4rem",
              },
              fontWeight: 800,
              textAlign: "center",
              letterSpacing: "-0.04em",
            }}
          >
            AI Music Finder
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mt: 2,
              mb: 6,
              textAlign: "center",
              fontWeight: 400,
            }}
          >
            Discover your next favorite song.
          </Typography>

          <Box
            sx={{
              width: "100%",
              maxWidth: 700,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                width: "100%",
              }}
            >
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder="Search for a song or artist..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 4,
                    backgroundColor: "background.paper",
                    fontSize: "1.1rem",
                    minHeight: 64,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",

                    "&:hover": {
                      backgroundColor: "#19191f",
                    },

                    "&.Mui-focused": {
                      boxShadow:
                        "0 0 0 2px rgba(168,85,247,0.25)",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loadingSearch}
                startIcon={<SearchIcon />}
                sx={{
                  minWidth: 120,
                  borderRadius: 4,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                }}
              >
                Search
              </Button>
            </Box>
          </Box>

          {searchResults.length > 0 && (
            <Box sx={{ width: "100%", maxWidth: 700, mt: 3 }}>
              {searchResults.map((song) => (
                <Card
                  key={song.id}
                  onClick={() => getRecommendations(song)}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    cursor: "pointer",
                    backgroundColor: "background.paper",
                    "&:hover": {
                      backgroundColor: "#19191f",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {song.artwork ? (
                        <Box
                          component="img"
                          src={song.artwork}
                          alt={`${song.title} album artwork`}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#211a2d",
                            flexShrink: 0,
                          }}
                        >
                          <MusicNoteIcon color="primary" />
                        </Box>
                      )}

                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {song.title}
                        </Typography>

                        <Typography color="text.secondary">
                          {song.artist}
                          {song.album ? ` · ${song.album}` : ""}
                        </Typography>

                        {song.year && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {song.year}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {selectedSong && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 700,
                mt: 6,
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
              >
                Selected song
              </Typography>

              <Card
                sx={{
                  mt: 1,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, #211a2d, #15151a)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {selectedSong.artwork ? (
                      <Box
                        component="img"
                        src={selectedSong.artwork}
                        alt={`${selectedSong.title} album artwork`}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#211a2d",
                          flexShrink: 0,
                        }}
                      >
                        <MusicNoteIcon
                          color="primary"
                          sx={{ fontSize: 36 }}
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        flex: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={700}
                      >
                        {selectedSong.title}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {selectedSong.artist}

                        {selectedSong.album
                          ? ` · ${selectedSong.album}`
                          : ""}
                      </Typography>

                      {selectedSong.year && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                          }}
                        >
                          {selectedSong.year}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {loadingRecommendations && (
            <Box
              sx={{
                mt: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress color="primary" />

              <Typography color="text.secondary">
                Finding songs for you...
              </Typography>
            </Box>
          )}

          {!loadingRecommendations &&
            recommendations.length > 0 && (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 700,
                  mt: 8,
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    mb: 3,
                  }}
                >
                  Similar songs
                </Typography>

                {recommendations.map((song, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 2,
                      borderRadius: 3,
                      backgroundColor: "background.paper",
                      transition:
                        "transform 0.2s ease",
                      "&:hover": {
                        transform:
                          "translateY(-3px)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-start",
                        }}
                      >
                        <MusicNoteIcon
                          color="primary"
                          sx={{
                            mt: 0.5,
                          }}
                        />

                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {song.title}
                          </Typography>

                          <Typography color="text.secondary">
                            {song.artist}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                            }}
                          >
                            {song.reason}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;