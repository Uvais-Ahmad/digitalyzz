import type { Client, Worker, Task, ValidationError } from "@/lib/types"

export class DataValidator {
  private errors: ValidationError[] = []

  validateAll(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    this.errors = []

    // Individual entity validations
    this.validateClients(clients)
    this.validateWorkers(workers)
    this.validateTasks(tasks)

    // Cross-reference validations
    this.validateCrossReferences(clients, workers, tasks)

    // Business logic validations
    this.validateBusinessLogic(clients, workers, tasks)

    return this.errors
  }

  validateClients(clients: Client[]): ValidationError[] {
    const currentErrors = this.errors.length

    // Check for missing required fields
    clients.forEach((client, index) => {
      if (!client.ClientID) {
        this.addError("missing-field", "error", `Client at row ${index + 1} missing ClientID`, "clients", "ClientID")
      }
      if (!client.ClientName) {
        this.addError(
          "missing-field",
          "error",
          `Client at row ${index + 1} missing ClientName`,
          "clients",
          "ClientName",
        )
      }
      if (client.PriorityLevel < 1 || client.PriorityLevel > 10) {
        this.addError(
          "invalid-range",
          "warning",
          `Client ${client.ClientID} has invalid priority level (${client.PriorityLevel}). Must be 1-10.`,
          "clients",
          "PriorityLevel",
        )
      }

      // Validate RequestedTaskIDs format
      if (client.RequestedTaskIDs && !Array.isArray(client.RequestedTaskIDs)) {
        this.addError(
          "malformed-list",
          "error",
          `Client ${client.ClientID} has malformed RequestedTaskIDs. Expected array format.`,
          "clients",
          "RequestedTaskIDs",
        )
      }

      // Validate AttributesJSON
      if (client.AttributesJSON && typeof client.AttributesJSON !== "object") {
        this.addError(
          "broken-json",
          "error",
          `Client ${client.ClientID} has invalid AttributesJSON format.`,
          "clients",
          "AttributesJSON",
        )
      }
    })

    // Check for duplicate IDs
    const ids = clients.map((c) => c.ClientID).filter(Boolean)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    duplicates.forEach((id) => {
      this.addError("duplicate-id", "error", `Duplicate ClientID: ${id}`, "clients", "ClientID")
    })

    return this.errors.slice(currentErrors)
  }

  validateWorkers(workers: Worker[]): ValidationError[] {
    const currentErrors = this.errors.length

    workers.forEach((worker, index) => {
      if (!worker.WorkerID) {
        this.addError("missing-field", "error", `Worker at row ${index + 1} missing WorkerID`, "workers", "WorkerID")
      }
      if (!worker.WorkerName) {
        this.addError(
          "missing-field",
          "error",
          `Worker at row ${index + 1} missing WorkerName`,
          "workers",
          "WorkerName",
        )
      }

      // Validate Skills array
      if (!Array.isArray(worker.Skills)) {
        this.addError(
          "malformed-list",
          "error",
          `Worker ${worker.WorkerID} has malformed Skills. Expected array format.`,
          "workers",
          "Skills",
        )
      } else if (worker.Skills.length === 0) {
        this.addError(
          "invalid-skills",
          "warning",
          `Worker ${worker.WorkerID} has no skills defined`,
          "workers",
          "Skills",
        )
      }

      // Validate AvailableSlots array
      if (!Array.isArray(worker.AvailableSlots)) {
        this.addError(
          "malformed-list",
          "error",
          `Worker ${worker.WorkerID} has malformed AvailableSlots. Expected array format.`,
          "workers",
          "AvailableSlots",
        )
      } else if (worker.AvailableSlots.some((slot) => slot < 1 || slot > 10)) {
        this.addError(
          "invalid-range",
          "warning",
          `Worker ${worker.WorkerID} has invalid slot numbers. Slots must be 1-10.`,
          "workers",
          "AvailableSlots",
        )
      }

      // Validate qualification level
      if (worker.QualificationLevel < 1 || worker.QualificationLevel > 5) {
        this.addError(
          "invalid-range",
          "warning",
          `Worker ${worker.WorkerID} has invalid qualification level (${worker.QualificationLevel}). Must be 1-5.`,
          "workers",
          "QualificationLevel",
        )
      }

      // Validate MaxLoadPerPhase
      if (worker.MaxLoadPerPhase <= 0) {
        this.addError(
          "invalid-range",
          "error",
          `Worker ${worker.WorkerID} has invalid MaxLoadPerPhase (${worker.MaxLoadPerPhase}). Must be > 0.`,
          "workers",
          "MaxLoadPerPhase",
        )
      }
    })

    // Check for duplicate IDs
    const ids = workers.map((w) => w.WorkerID).filter(Boolean)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    duplicates.forEach((id) => {
      this.addError("duplicate-id", "error", `Duplicate WorkerID: ${id}`, "workers", "WorkerID")
    })

    return this.errors.slice(currentErrors)
  }

  validateTasks(tasks: Task[]): ValidationError[] {
    const currentErrors = this.errors.length

    tasks.forEach((task, index) => {
      if (!task.TaskID) {
        this.addError("missing-field", "error", `Task at row ${index + 1} missing TaskID`, "tasks", "TaskID")
      }
      if (!task.TaskName) {
        this.addError("missing-field", "error", `Task at row ${index + 1} missing TaskName`, "tasks", "TaskName")
      }

      // Validate Duration
      if (task.Duration <= 0) {
        this.addError(
          "invalid-duration",
          "error",
          `Task ${task.TaskID} has invalid duration (${task.Duration}). Must be > 0.`,
          "tasks",
          "Duration",
        )
      }

      // Validate RequiredSkills array
      if (!Array.isArray(task.RequiredSkills)) {
        this.addError(
          "malformed-list",
          "error",
          `Task ${task.TaskID} has malformed RequiredSkills. Expected array format.`,
          "tasks",
          "RequiredSkills",
        )
      }

      // Validate PreferredPhases array
      if (!Array.isArray(task.PreferredPhases)) {
        this.addError(
          "malformed-list",
          "error",
          `Task ${task.TaskID} has malformed PreferredPhases. Expected array format.`,
          "tasks",
          "PreferredPhases",
        )
      } else if (task.PreferredPhases.some((phase) => phase < 1 || phase > 10)) {
        this.addError(
          "invalid-range",
          "warning",
          `Task ${task.TaskID} has invalid phase numbers. Phases must be 1-10.`,
          "tasks",
          "PreferredPhases",
        )
      }

      // Validate MaxConcurrent
      if (task.MaxConcurrent <= 0) {
        this.addError(
          "invalid-range",
          "error",
          `Task ${task.TaskID} has invalid MaxConcurrent (${task.MaxConcurrent}). Must be > 0.`,
          "tasks",
          "MaxConcurrent",
        )
      }
    })

    // Check for duplicate IDs
    const ids = tasks.map((t) => t.TaskID).filter(Boolean)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    duplicates.forEach((id) => {
      this.addError("duplicate-id", "error", `Duplicate TaskID: ${id}`, "tasks", "TaskID")
    })

    return this.errors.slice(currentErrors)
  }

  validateCrossReferences(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    const currentErrors = this.errors.length

    const taskIds = new Set(tasks.map((t) => t.TaskID))
    const workerSkills = new Set(workers.flatMap((w) => this.ensureArray(w.Skills)))
    const clientIds = new Set(clients.map((c) => c.ClientID))

    // Check client requested tasks exist
    clients.forEach((client) => {
      const requestedTasks = this.ensureArray(client.RequestedTaskIDs)
      requestedTasks.forEach((taskId) => {
        if (!taskIds.has(taskId)) {
          this.addError(
            "broken-reference",
            "error",
            `Client ${client.ClientID} references non-existent task: ${taskId}`,
            "clients",
            "RequestedTaskIDs",
          )
        }
      })
    })

    // Check task required skills are available
    tasks.forEach((task) => {
      const requiredSkills = this.ensureArray(task.RequiredSkills)
      requiredSkills.forEach((skill) => {
        if (!workerSkills.has(skill)) {
          this.addError(
            "missing-skill",
            "warning",
            `Task ${task.TaskID} requires skill "${skill}" but no worker has it`,
            "tasks",
            "RequiredSkills",
          )
        }
      })
    })

    // Check for circular co-run groups (if GroupTag represents co-run groups)
    this.validateCoRunGroups(clients)

    return this.errors.slice(currentErrors)
  }

  validateBusinessLogic(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    const currentErrors = this.errors.length

    // Skill coverage matrix validation
    this.validateSkillCoverage(workers, tasks)

    // Phase-slot saturation validation
    this.validatePhaseSlotSaturation(workers, tasks)

    // Worker overload validation
    this.validateWorkerOverload(clients, workers, tasks)

    // Priority distribution validation
    this.validatePriorityDistribution(clients)

    // Task complexity vs worker qualification validation
    this.validateTaskComplexity(workers, tasks)

    return this.errors.slice(currentErrors)
  }

  private validateCoRunGroups(clients: Client[]): void {
    const groupMap = new Map<string, string[]>()

    // Build group map
    clients.forEach((client) => {
      if (client.GroupTag && client.GroupTag !== "default") {
        if (!groupMap.has(client.GroupTag)) {
          groupMap.set(client.GroupTag, [])
        }
        groupMap.get(client.GroupTag)!.push(client.ClientID)
      }
    })

    // Check for potential circular dependencies in co-run groups
    groupMap.forEach((clientIds, groupTag) => {
      if (clientIds.length > 10) {
        this.addError(
          "circular-corun",
          "warning",
          `Co-run group "${groupTag}" has ${clientIds.length} clients, which may cause scheduling conflicts`,
          "clients",
          "GroupTag",
        )
      }
    })
  }

  private validateSkillCoverage(workers: Worker[], tasks: Task[]): void {
    const skillDemand = new Map<string, number>()
    const skillSupply = new Map<string, number>()

    // Calculate skill demand from tasks
    tasks.forEach((task) => {
      const requiredSkills = this.ensureArray(task.RequiredSkills)
      requiredSkills.forEach((skill) => {
        skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1)
      })
    })

    // Calculate skill supply from workers
    workers.forEach((worker) => {
      const skills = this.ensureArray(worker.Skills)
      skills.forEach((skill) => {
        skillSupply.set(skill, (skillSupply.get(skill) || 0) + 1)
      })
    })

    // Check for skill shortages
    skillDemand.forEach((demand, skill) => {
      const supply = skillSupply.get(skill) || 0
      if (supply < demand) {
        this.addError(
          "skill-shortage",
          "warning",
          `Skill "${skill}" is required by ${demand} tasks but only ${supply} workers have it`,
          "tasks",
          "RequiredSkills",
        )
      }
    })
  }

  private validatePhaseSlotSaturation(workers: Worker[], tasks: Task[]): void {
    const phaseCapacity = new Map<number, number>()
    const phaseDemand = new Map<number, number>()

    // Calculate phase capacity from workers
    workers.forEach((worker) => {
      const availableSlots = this.ensureArray(worker.AvailableSlots)
      availableSlots.forEach((slot) => {
        const slotNum = typeof slot === "string" ? Number.parseInt(slot) : slot
        if (!isNaN(slotNum)) {
          phaseCapacity.set(slotNum, (phaseCapacity.get(slotNum) || 0) + worker.MaxLoadPerPhase)
        }
      })
    })

    // Calculate phase demand from tasks
    tasks.forEach((task) => {
      const preferredPhases = this.ensureArray(task.PreferredPhases)
      preferredPhases.forEach((phase) => {
        const phaseNum = typeof phase === "string" ? Number.parseInt(phase) : phase
        if (!isNaN(phaseNum)) {
          phaseDemand.set(phaseNum, (phaseDemand.get(phaseNum) || 0) + task.Duration)
        }
      })
    })

    // Check for phase saturation
    phaseDemand.forEach((demand, phase) => {
      const capacity = phaseCapacity.get(phase) || 0
      if (demand > capacity * 0.8) {
        // 80% threshold
        this.addError(
          "phase-saturation",
          "warning",
          `Phase ${phase} may be oversaturated: ${demand} demand vs ${capacity} capacity`,
          "tasks",
          "PreferredPhases",
        )
      }
    })
  }

  private validateWorkerOverload(clients: Client[], workers: Worker[], tasks: Task[]): void {
    const workerLoad = new Map<string, number>()

    // Calculate potential load per worker based on their skills
    clients.forEach((client) => {
      const requestedTasks = this.ensureArray(client.RequestedTaskIDs)
      requestedTasks.forEach((taskId) => {
        const task = tasks.find((t) => t.TaskID === taskId)
        if (task) {
          const taskSkills = this.ensureArray(task.RequiredSkills)
          const capableWorkers = workers.filter((worker) => {
            const workerSkills = this.ensureArray(worker.Skills)
            return taskSkills.every((skill) => workerSkills.includes(skill))
          })

          if (capableWorkers.length > 0) {
            const loadPerWorker = task.Duration / capableWorkers.length
            capableWorkers.forEach((worker) => {
              workerLoad.set(worker.WorkerID, (workerLoad.get(worker.WorkerID) || 0) + loadPerWorker)
            })
          }
        }
      })
    })

    // Check for overloaded workers
    workerLoad.forEach((load, workerId) => {
      const worker = workers.find((w) => w.WorkerID === workerId)
      if (worker && load > worker.MaxLoadPerPhase * 1.2) {
        // 120% threshold
        this.addError(
          "worker-overload",
          "warning",
          `Worker ${workerId} may be overloaded: ${load.toFixed(1)} estimated load vs ${worker.MaxLoadPerPhase} max capacity`,
          "workers",
          "MaxLoadPerPhase",
        )
      }
    })
  }

  private validatePriorityDistribution(clients: Client[]): void {
    const priorityCounts = new Map<number, number>()

    clients.forEach((client) => {
      const priority = client.PriorityLevel
      priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1)
    })

    const totalClients = clients.length
    const highPriorityCount = (priorityCounts.get(9) || 0) + (priorityCounts.get(10) || 0)

    if (highPriorityCount > totalClients * 0.3) {
      // More than 30% high priority
      this.addError(
        "priority-imbalance",
        "warning",
        `${highPriorityCount} clients (${((highPriorityCount / totalClients) * 100).toFixed(1)}%) have high priority (9-10). Consider rebalancing priorities.`,
        "clients",
        "PriorityLevel",
      )
    }
  }

  private validateTaskComplexity(workers: Worker[], tasks: Task[]): void {
    tasks.forEach((task) => {
      const requiredSkills = this.ensureArray(task.RequiredSkills)
      const skillCount = requiredSkills.length
      const duration = task.Duration

      // Define complexity score
      const complexityScore = skillCount * 2 + duration

      if (complexityScore > 10) {
        // High complexity task
        const qualifiedWorkers = workers.filter((worker) => {
          const workerSkills = this.ensureArray(worker.Skills)
          return worker.QualificationLevel >= 4 && requiredSkills.every((skill) => workerSkills.includes(skill))
        })

        if (qualifiedWorkers.length === 0) {
          this.addError(
            "complexity-mismatch",
            "error",
            `High complexity task ${task.TaskID} (score: ${complexityScore}) has no qualified workers (level 4+)`,
            "tasks",
            "RequiredSkills",
          )
        } else if (qualifiedWorkers.length < 2) {
          this.addError(
            "complexity-mismatch",
            "warning",
            `High complexity task ${task.TaskID} has only ${qualifiedWorkers.length} qualified worker(s). Consider adding backup resources.`,
            "tasks",
            "RequiredSkills",
          )
        }
      }
    })
  }

  private addError(type: string, severity: "error" | "warning", message: string, entity: string, field?: string) {
    this.errors.push({
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      severity,
      message,
      entity,
      field,
      suggestions: this.getSuggestions(type, field),
    })
  }

  private getSuggestions(type: string, field?: string): string[] {
    const suggestions: Record<string, string[]> = {
      "missing-field": ["Check if the column exists in your file", "Verify column headers match expected format"],
      "duplicate-id": ["Use unique identifiers for each row", "Check for copy-paste errors"],
      "invalid-range": ["Check the valid range for this field", "Verify data entry is correct"],
      "malformed-list": [
        "Use comma or semicolon separated values",
        "Ensure proper array format: [item1, item2, item3]",
      ],
      "broken-json": ["Validate JSON syntax", "Use proper JSON format with quotes around keys"],
      "broken-reference": ["Ensure referenced IDs exist in the related file", "Check for typos in ID references"],
      "missing-skill": ["Add workers with required skills", "Update task requirements to match available skills"],
      "circular-corun": ["Review co-run group assignments", "Consider splitting large groups"],
      "skill-shortage": [
        "Train existing workers in required skills",
        "Hire workers with needed skills",
        "Reduce skill requirements for some tasks",
      ],
      "phase-saturation": [
        "Redistribute tasks across phases",
        "Add more workers to saturated phases",
        "Extend project timeline",
      ],
      "worker-overload": [
        "Redistribute workload among team members",
        "Hire additional workers",
        "Extend task deadlines",
      ],
      "priority-imbalance": [
        "Review and adjust client priorities",
        "Use priority levels more strategically",
        "Consider priority-based scheduling",
      ],
      "complexity-mismatch": [
        "Assign high-qualification workers to complex tasks",
        "Break down complex tasks into smaller parts",
        "Provide additional training to workers",
      ],
    }

    return suggestions[type] || []
  }

  // Helper method to ensure fields are arrays
  private ensureArray(field: any): any[] {
    if (Array.isArray(field)) {
      return field
    }
    if (typeof field === "string" && field.trim()) {
      // Handle comma-separated strings
      return field
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item)
    }
    return []
  }
}
