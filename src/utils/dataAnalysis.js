export const analyzeEmailData = (data) => {
  if (!data || data.length === 0) {
    return {
      overview: {
        totalEmails: 0,
        delivered: 0,
        bounced: 0,
        deferrals: 0,
        deliveryRate: 0,
        bounceRate: 0,
      },
      bounceAnalysis: {},
      vmtaPerformance: {},
      timelineData: [],
      diagnosticCodes: {},
    };
  }

  // Overview statistics
  const totalEmails = data.length;
  const delivered = data.filter(
    (row) => row.dsnAction === "delivered" || row.dsnAction === "relayed"
  ).length;
  const bounced = data.filter(
    (row) => row.dsnAction === "failed" || row.dsnAction === "bounced"
  ).length;
  const deferrals = data.filter(
    (row) => row.dsnAction === "delayed" || row.dsnAction === "deferred"
  ).length;

  const deliveryRate =
    totalEmails > 0 ? ((delivered / totalEmails) * 100).toFixed(2) : 0;
  const bounceRate =
    totalEmails > 0 ? ((bounced / totalEmails) * 100).toFixed(2) : 0;

  // Bounce analysis by category
  const bounceAnalysis = data
    .filter(
      (row) =>
        (row.dsnAction === "failed" || row.dsnAction === "bounced") &&
        row.bounceCat
    )
    .reduce((acc, row) => {
      const category = row.bounceCat.toLowerCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

  // VMTA performance analysis
  const vmtaPerformance = data
    .filter((row) => row.vmta)
    .reduce((acc, row) => {
      const vmta = row.vmta;
      if (!acc[vmta]) {
        acc[vmta] = {
          name: vmta,
          total: 0,
          delivered: 0,
          bounced: 0,
          deferred: 0,
        };
      }

      acc[vmta].total++;

      if (row.dsnAction === "delivered" || row.dsnAction === "relayed") {
        acc[vmta].delivered++;
      } else if (row.dsnAction === "failed" || row.dsnAction === "bounced") {
        acc[vmta].bounced++;
      } else if (row.dsnAction === "delayed" || row.dsnAction === "deferred") {
        acc[vmta].deferred++;
      }

      return acc;
    }, {});

  // Add performance metrics to VMTA data
  Object.values(vmtaPerformance).forEach((vmta) => {
    vmta.deliveryRate =
      vmta.total > 0 ? ((vmta.delivered / vmta.total) * 100).toFixed(2) : 0;
    vmta.bounceRate =
      vmta.total > 0 ? ((vmta.bounced / vmta.total) * 100).toFixed(2) : 0;
  });

  // Timeline data (hourly aggregation)
  const timelineData = generateTimelineData(data);

  // Diagnostic codes analysis
  const diagnosticCodes = data
    .filter((row) => row.dsnDiag && row.dsnDiag.trim())
    .reduce((acc, row) => {
      const code = row.dsnDiag.trim();
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

  return {
    overview: {
      totalEmails,
      delivered,
      bounced,
      deferrals,
      deliveryRate: parseFloat(deliveryRate),
      bounceRate: parseFloat(bounceRate),
    },
    bounceAnalysis,
    vmtaPerformance,
    timelineData,
    diagnosticCodes,
  };
};

const generateTimelineData = (data) => {
  const timelineMap = {};

  data.forEach((row) => {
    if (!row.timeLoggedParsed) return;

    // Group by hour
    const hourKey = new Date(row.timeLoggedParsed);
    hourKey.setMinutes(0, 0, 0);
    const key = hourKey.toISOString();

    if (!timelineMap[key]) {
      timelineMap[key] = {
        time: hourKey,
        delivered: 0,
        bounced: 0,
        deferred: 0,
        total: 0,
      };
    }

    timelineMap[key].total++;

    if (row.dsnAction === "delivered" || row.dsnAction === "relayed") {
      timelineMap[key].delivered++;
    } else if (row.dsnAction === "failed" || row.dsnAction === "bounced") {
      timelineMap[key].bounced++;
    } else if (row.dsnAction === "delayed" || row.dsnAction === "deferred") {
      timelineMap[key].deferred++;
    }
  });

  return Object.values(timelineMap).sort((a, b) => a.time - b.time);
};

export const searchData = (data, searchTerm, searchType = "recipient") => {
  if (!searchTerm || !data) return data;

  const term = searchTerm.toLowerCase();

  return data.filter((row) => {
    switch (searchType) {
      case "recipient":
        return row.rcpt && row.rcpt.toLowerCase().includes(term);
      case "sender":
        return row.orig && row.orig.toLowerCase().includes(term);
      case "diagnostic":
        return row.dsnDiag && row.dsnDiag.toLowerCase().includes(term);
      case "vmta":
        return row.vmta && row.vmta.toLowerCase().includes(term);
      default:
        return (
          (row.rcpt && row.rcpt.toLowerCase().includes(term)) ||
          (row.orig && row.orig.toLowerCase().includes(term)) ||
          (row.dsnDiag && row.dsnDiag.toLowerCase().includes(term)) ||
          (row.vmta && row.vmta.toLowerCase().includes(term))
        );
    }
  });
};

export const filterData = (data, filters) => {
  if (!data || !filters) return data;

  return data.filter((row) => {
    // Date range filter
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      if (!row.timeLoggedParsed) return false;
      const date = row.timeLoggedParsed;
      if (date < filters.dateRange.start || date > filters.dateRange.end) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      if (row.dsnAction !== filters.status) return false;
    }

    // VMTA filter
    if (filters.vmta && filters.vmta !== "all") {
      if (row.vmta !== filters.vmta) return false;
    }

    // Bounce category filter
    if (filters.bounceCategory && filters.bounceCategory !== "all") {
      if (
        !row.bounceCat ||
        row.bounceCat.toLowerCase() !== filters.bounceCategory.toLowerCase()
      ) {
        return false;
      }
    }

    return true;
  });
};

export const paginateData = (data, page, itemsPerPage) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    data: data.slice(startIndex, endIndex),
    totalPages: Math.ceil(data.length / itemsPerPage),
    currentPage: page,
    totalItems: data.length,
  };
};
