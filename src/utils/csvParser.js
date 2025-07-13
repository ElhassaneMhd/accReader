import Papa from "papaparse";

// Parse CSV string data (for auto-import)
export const parseCSVString = (csvString) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV String Parse Results:", results);

        if (results.errors.length > 0) {
          console.warn("CSV String Parse Warnings:", results.errors);
        }

        try {
          // Process and clean the data (same logic as parseCSVFile)
          const processedData = results.data
            .filter(
              (row) =>
                row &&
                Object.keys(row).some((key) => row[key] && row[key].trim())
            )
            .map((row) => {
              // Clean and process the row data
              const processedRow = {};

              Object.keys(row).forEach((key) => {
                const value = row[key];
                if (value !== null && value !== undefined) {
                  processedRow[key] = String(value).trim();
                } else {
                  processedRow[key] = "";
                }
              });

              // Parse dates with timezone support
              if (processedRow.timeLogged) {
                processedRow.timeLoggedParsed = parseDateTime(
                  processedRow.timeLogged
                );
              }
              if (processedRow.timeQueued) {
                processedRow.timeQueuedParsed = parseDateTime(
                  processedRow.timeQueued
                );
              }

              // Normalize bounce category
              if (processedRow.bounceCat) {
                processedRow.bounceCat = processedRow.bounceCat.toLowerCase();
              }

              return processedRow;
            });

          console.log(
            `Processed ${processedData.length} records from CSV string`
          );
          resolve(processedData);
        } catch (error) {
          console.error("Error processing CSV string data:", error);
          reject(error);
        }
      },
      error: (error) => {
        console.error("Papa Parse Error (string):", error);
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV Parse Results:", results);

        if (results.errors.length > 0) {
          console.warn("CSV Parse Warnings:", results.errors);
        }

        // Validate that we have the required columns
        const requiredColumns = [
          "type",
          "timeLogged",
          "timeQueued",
          "orig",
          "rcpt",
          "dsnAction",
          "dsnStatus",
        ];
        const headers = results.meta.fields || [];
        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          reject(
            new Error(`Missing required columns: ${missingColumns.join(", ")}`)
          );
          return;
        }

        // Process and clean the data
        const processedData = results.data
          .filter(
            (row) =>
              row && Object.keys(row).some((key) => row[key] && row[key].trim())
          )
          .map((row) => {
            // Clean and process the row data
            const processedRow = {};

            Object.keys(row).forEach((key) => {
              const value = row[key];
              if (value !== null && value !== undefined) {
                processedRow[key] = String(value).trim();
              } else {
                processedRow[key] = "";
              }
            });

            // Parse dates with timezone support
            if (processedRow.timeLogged) {
              processedRow.timeLoggedParsed = parseDateTime(
                processedRow.timeLogged
              );
            }
            if (processedRow.timeQueued) {
              processedRow.timeQueuedParsed = parseDateTime(
                processedRow.timeQueued
              );
            }

            // Normalize bounce category
            if (processedRow.bounceCat) {
              processedRow.bounceCat = processedRow.bounceCat.toLowerCase();
            }

            return processedRow;
          });

        console.log(`Processed ${processedData.length} records`);
        resolve(processedData);
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        reject(error);
      },
    });
  });
};

export const parseDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;

  try {
    // Handle format: "2025-07-10 11:58:57+0300"
    if (dateTimeString.includes("+") || dateTimeString.includes("-")) {
      // Parse timezone offset
      const match = dateTimeString.match(/^(.+?)([+-]\d{4})$/);
      if (match) {
        const dateTimePart = match[1].trim();
        const timezonePart = match[2];

        // Create date object
        const date = new Date(
          dateTimePart.replace(" ", "T") +
            timezonePart.substring(0, 3) +
            ":" +
            timezonePart.substring(3)
        );

        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Fallback to standard parsing
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch (error) {
    console.warn("Failed to parse date:", dateTimeString, error);
    return null;
  }
};

export const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    // Handle both Date objects and date strings
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

export const getDateRange = (data) => {
  const dates = data
    .map((row) => row.timeLoggedParsed)
    .filter((date) => date && !isNaN(date.getTime()));

  if (dates.length === 0) return { start: null, end: null };

  return {
    start: new Date(Math.min(...dates.map((d) => d.getTime()))),
    end: new Date(Math.max(...dates.map((d) => d.getTime()))),
  };
};
