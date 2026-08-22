// ===============================
// File: src/pages/tickets/visitReport/VisitReportMembers.jsx
// ===============================

import {
  Box, Typography, TextField, IconButton, Checkbox,
  FormControlLabel, Button, Paper, Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Controlled editor for "Present From" groups, e.g.:
 *   [{ company: "TSF", people: [{ name, online }] },
 *    { company: "Sun Pharma", people: [{ name, online }] }]
 *
 * Supports any number of groups (not just TSF/Customer) so a third
 * party like an OEM engineer (see the FL Tecnics column in the sample
 * report) fits without changing shape.
 */
export default function VisitReportMembers({ groups, onChange }) {
  const updateGroup = (gIdx, patch) => {
    onChange(groups.map((g, i) => (i === gIdx ? { ...g, ...patch } : g)));
  };

  const updatePerson = (gIdx, pIdx, patch) => {
    onChange(
      groups.map((g, i) => {
        if (i !== gIdx) return g;
        return {
          ...g,
          people: g.people.map((p, j) => (j === pIdx ? { ...p, ...patch } : p)),
        };
      })
    );
  };

  const addPerson = (gIdx) => {
    onChange(
      groups.map((g, i) =>
        i === gIdx ? { ...g, people: [...g.people, { name: "", online: false }] } : g
      )
    );
  };

  const removePerson = (gIdx, pIdx) => {
    onChange(
      groups.map((g, i) =>
        i === gIdx ? { ...g, people: g.people.filter((_, j) => j !== pIdx) } : g
      )
    );
  };

  const addGroup = () => {
    onChange([...groups, { company: "", people: [{ name: "", online: false }] }]);
  };

  const removeGroup = (gIdx) => {
    onChange(groups.filter((_, i) => i !== gIdx));
  };

  return (
    <Stack spacing={2}>
      {groups.map((group, gIdx) => (
        <Paper key={gIdx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.5 }}>
            <TextField
              label="Present From (Company)"
              size="small"
              fullWidth
              value={group.company}
              onChange={(e) => updateGroup(gIdx, { company: e.target.value })}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => removeGroup(gIdx)}
              disabled={groups.length === 1}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          <Stack spacing={1}>
            {group.people.map((person, pIdx) => (
              <Box key={pIdx} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  label="Name"
                  size="small"
                  fullWidth
                  value={person.name}
                  onChange={(e) => updatePerson(gIdx, pIdx, { name: e.target.value })}
                />
                <FormControlLabel
                  sx={{ mr: 0, whiteSpace: "nowrap" }}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!person.online}
                      onChange={(e) => updatePerson(gIdx, pIdx, { online: e.target.checked })}
                    />
                  }
                  label="Online"
                />
                <IconButton
                  size="small"
                  onClick={() => removePerson(gIdx, pIdx)}
                  disabled={group.people.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>

          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => addPerson(gIdx)}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Add Person
          </Button>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addGroup}
        sx={{ textTransform: "none", alignSelf: "flex-start" }}
      >
        Add Group
      </Button>
    </Stack>
  );
}