# LGrow mobile app — UI kit

An interactive recreation of the LGrow iPhone app (390×844), composed from the
primitives in `components/`. Open `index.html`; the pill row under the phone jumps
to any screen, and the flows are clickable end to end.

## Flow
Onboarding → Login (phone + Google/Facebook/Apple) → OTP check (in-app keypad) →
Basic information → Connect device → **Home**. From Home the tab bar reaches
Coaching, Chats and Profile; Home and Coaching open the exercise timer; Coaching's
Nutrition tab opens the AI food scanner; Profile's sleep alert opens Sleep tracking;
the chat list opens a thread you can type into.

## Files
| File | Screens |
| --- | --- |
| `PhoneShell.jsx` | Device frame, status bar, floating tab bar, `Screen`/`SectionTitle` helpers |
| `AuthFlow.jsx` | Onboarding, Login, OTP, Basic information, Connect device |
| `HomeScreen.jsx` | Route card, ETA + "You Beat Your Limit", Daily Process, Discover New Exercises |
| `ExerciseScreen.jsx` | Battle Rope timer over full-bleed photography (runs live) |
| `CoachingScreen.jsx` | Exercises tab (activity heatmap, Today Exercises) + Nutrition tab |
| `ScanScreen.jsx` | AI food scanner with the ingredient/calorie result sheet |
| `SleepScreen.jsx` | Sleep score gauge, month stage chart, added data |
| `ChatScreens.jsx` | Chats list and a live chat thread |
| `ProfileScreen.jsx` | Cover, streak + sleep alert, Overall Stat, Steps Tracking, Find Out More |

## Known abbreviations
- The home map is a schematic grid + route path, not a real map tile — the source
  render's map data was not available.
- Body-scan and device renders are cropped from the case-study boards.
- Lists are truncated (3 exercises, 8 chats) to stand in for longer real data.
- The source's typos ("Cadio", "Couching") are preserved on the Coaching screen
  header only where they were legible brand copy; filter chips are corrected.
