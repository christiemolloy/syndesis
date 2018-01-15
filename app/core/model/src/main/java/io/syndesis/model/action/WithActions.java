/*
 * Copyright (C) 2016 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.syndesis.model.action;

import java.util.List;
import java.util.Optional;
import javax.validation.constraints.NotNull;

import io.syndesis.model.WithId;
import io.syndesis.model.validation.AllValidations;

public interface WithActions<T extends Action<? extends ActionDescriptor>> {

    @NotNull(groups = AllValidations.class)
    List<T> getActions();

    default Optional<T> findActionById(String actionId) {
        if (getActions() == null) {
            return Optional.empty();
        }

        return getActions().stream()
            .filter(WithId.class::isInstance)
            .filter(action -> ((WithId)action).getId().isPresent())
            .filter(action -> actionId.equals(((WithId)action).getId().get()))
            .findFirst();
    }
}
